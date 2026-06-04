import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, WarehouseType } from '@prisma/client';
import { ExchangeRateService } from '../finance/exchange-rate.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreateOrderDto } from './dto/create-order.dto';

const SHIPPING_FLAT_USD = 75;

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private exchangeRates: ExchangeRateService,
  ) {}

  async getCatalog(user: JwtPayload) {
    const storeId = this.requireStoreId(user);
    const store = await this.prisma.store.findUniqueOrThrow({ where: { id: storeId } });
    const rate = await this.exchangeRates.getRate(store.currency);

    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      include: {
        skus: {
          where: { isActive: true },
          include: {
            inventories: {
              where: { warehouseType: WarehouseType.hq_central, locationKey: 'hq' },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return products.map((p) => ({
      ...p,
      skus: p.skus.map((s) => {
        const hqInv = s.inventories[0];
        const available = hqInv ? hqInv.quantity - hqInv.reservedQty : 0;
        const priceUsd = Number(s.priceUsd);
        return {
          id: s.id,
          skuVariantCode: s.skuVariantCode,
          flavour: s.flavour,
          weightLabel: s.weightLabel,
          priceUsd,
          priceLocal: this.exchangeRates.convertUsdToLocal(priceUsd, rate),
          currency: store.currency,
          hqAvailable: available,
        };
      }),
    }));
  }

  async preview(user: JwtPayload, dto: CreateOrderDto) {
    const storeId = this.requireStoreId(user);
    return this.buildPricing(storeId, dto.items);
  }

  async create(user: JwtPayload, dto: CreateOrderDto) {
    const storeId = this.requireStoreId(user);
    const pricing = await this.buildPricing(storeId, dto.items);
    const orderNumber = await this.generateOrderNumber();

    return this.prisma.order.create({
      data: {
        orderNumber,
        storeId,
        createdById: user.sub,
        status: OrderStatus.draft,
        currency: pricing.currency,
        exchangeRate: pricing.exchangeRate,
        subtotalUsd: pricing.subtotalUsd,
        subtotalLocal: pricing.subtotalLocal,
        taxAmount: pricing.taxAmount,
        dutyAmount: pricing.dutyAmount,
        shippingAmount: pricing.shippingAmount,
        totalAmount: pricing.totalAmount,
        notes: dto.notes,
        items: {
          create: pricing.lines.map((line) => ({
            skuId: line.skuId,
            quantity: line.quantity,
            unitPriceUsd: line.unitPriceUsd,
            unitPriceLocal: line.unitPriceLocal,
            lineTotalUsd: line.lineTotalUsd,
            lineTotalLocal: line.lineTotalLocal,
            skuSnapshot: line.skuSnapshot,
          })),
        },
      },
      include: orderInclude,
    });
  }

  async createRestockOrder(user: JwtPayload, skuId: string) {
    const storeId = this.requireStoreId(user);
    const rule = await this.prisma.safetyStockRule.findUnique({
      where: { storeId_skuId: { storeId, skuId } },
    });
    if (!rule) {
      throw new NotFoundException('No safety stock rule for this SKU at your store');
    }
    const qty = rule.reorderQty > 0 ? rule.reorderQty : rule.safetyThreshold * 2;
    return this.create(user, {
      items: [{ skuId, quantity: qty }],
      notes: 'Auto-generated restock order from low-stock alert',
    });
  }

  async findAll(user: JwtPayload) {
    const where = user.storeId ? { storeId: user.storeId } : {};
    return this.prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: JwtPayload) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Order not found');
    this.assertOrderAccess(order.storeId, user);
    return order;
  }

  async submit(id: string, user: JwtPayload) {
    const order = await this.findOne(id, user);
    if (order.status !== OrderStatus.draft) {
      throw new BadRequestException('Only draft orders can be submitted');
    }
    await this.validateHqStock(order.items);

    return this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.pending_payment },
      include: orderInclude,
    });
  }

  async cancel(id: string, user: JwtPayload) {
    const order = await this.findOne(id, user);
    if (!['draft', 'pending_payment'].includes(order.status)) {
      throw new BadRequestException('Order cannot be cancelled in current status');
    }
    return this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.cancelled, cancelledAt: new Date() },
      include: orderInclude,
    });
  }

  private async buildPricing(storeId: string, items: { skuId: string; quantity: number }[]) {
    if (!items.length) {
      throw new BadRequestException('Order must have at least one item');
    }

    const store = await this.prisma.store.findUniqueOrThrow({ where: { id: storeId } });
    const rate = await this.exchangeRates.getRate(store.currency);
    const taxRate = Number(store.taxRate);
    const dutyRate = Number(store.importDutyRate);

    const lines: {
      skuId: string;
      quantity: number;
      unitPriceUsd: number;
      unitPriceLocal: number;
      lineTotalUsd: number;
      lineTotalLocal: number;
      skuSnapshot: object;
    }[] = [];

    let subtotalUsd = 0;

    for (const item of items) {
      const sku = await this.prisma.sku.findUnique({
        where: { id: item.skuId },
        include: { product: true },
      });
      if (!sku?.isActive) {
        throw new NotFoundException(`SKU ${item.skuId} not found`);
      }

      const hqInv = await this.prisma.inventory.findUnique({
        where: { skuId_locationKey: { skuId: item.skuId, locationKey: 'hq' } },
      });
      const available = hqInv ? hqInv.quantity - hqInv.reservedQty : 0;
      if (available < item.quantity) {
        throw new BadRequestException(
          `Insufficient HQ stock for ${sku.skuVariantCode}. Available: ${available}`,
        );
      }

      const unitPriceUsd = Number(sku.priceUsd);
      const unitPriceLocal = this.exchangeRates.convertUsdToLocal(unitPriceUsd, rate);
      const lineTotalUsd = Math.round(unitPriceUsd * item.quantity * 100) / 100;
      const lineTotalLocal = Math.round(unitPriceLocal * item.quantity * 100) / 100;

      subtotalUsd += lineTotalUsd;
      lines.push({
        skuId: item.skuId,
        quantity: item.quantity,
        unitPriceUsd,
        unitPriceLocal,
        lineTotalUsd,
        lineTotalLocal,
        skuSnapshot: {
          skuVariantCode: sku.skuVariantCode,
          flavour: sku.flavour,
          weightLabel: sku.weightLabel,
          productName: sku.product.name,
        },
      });
    }

    subtotalUsd = Math.round(subtotalUsd * 100) / 100;
    const subtotalLocal = this.exchangeRates.convertUsdToLocal(subtotalUsd, rate);
    const taxAmount = Math.round(subtotalLocal * taxRate * 100) / 100;
    const dutyAmount = Math.round(subtotalLocal * dutyRate * 100) / 100;
    const shippingLocal = this.exchangeRates.convertUsdToLocal(SHIPPING_FLAT_USD, rate);
    const totalAmount =
      Math.round((subtotalLocal + taxAmount + dutyAmount + shippingLocal) * 100) / 100;

    return {
      currency: store.currency,
      exchangeRate: rate,
      subtotalUsd,
      subtotalLocal,
      taxAmount,
      dutyAmount,
      shippingAmount: shippingLocal,
      totalAmount,
      lines,
      breakdown: {
        subtotalLocal,
        taxRate,
        dutyRate,
        taxAmount,
        dutyAmount,
        shippingUsd: SHIPPING_FLAT_USD,
        shippingLocal,
      },
    };
  }

  private async validateHqStock(items: { skuId: string; quantity: number }[]) {
    for (const item of items) {
      const hqInv = await this.prisma.inventory.findUnique({
        where: { skuId_locationKey: { skuId: item.skuId, locationKey: 'hq' } },
      });
      const available = hqInv ? hqInv.quantity - hqInv.reservedQty : 0;
      if (available < item.quantity) {
        throw new BadRequestException(`Insufficient HQ stock for SKU ${item.skuId}`);
      }
    }
  }

  async reserveHqStock(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return;

    for (const item of order.items) {
      await this.prisma.inventory.updateMany({
        where: { skuId: item.skuId, locationKey: 'hq' },
        data: { reservedQty: { increment: item.quantity } },
      });
    }
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const prefix = `HVP-ORD-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const count = await this.prisma.order.count({
      where: { orderNumber: { startsWith: prefix } },
    });
    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }

  private requireStoreId(user: JwtPayload): string {
    if (!user.storeId) {
      throw new ForbiddenException('Only store managers can place B2B orders');
    }
    return user.storeId;
  }

  private assertOrderAccess(storeId: string, user: JwtPayload) {
    if (user.storeId && user.storeId !== storeId) {
      throw new ForbiddenException('Access denied to this order');
    }
  }
}

const orderInclude = {
  items: {
    include: {
      sku: {
        include: { product: { select: { name: true, skuCode: true } } },
      },
    },
  },
  store: { select: { id: true, code: true, name: true, currency: true } },
  payments: { orderBy: { createdAt: 'desc' as const } },
  shipment: {
    include: { milestones: { orderBy: { occurredAt: 'asc' as const } } },
  },
};
