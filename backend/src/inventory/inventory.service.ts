import { ForbiddenException, Injectable } from '@nestjs/common';
import { WarehouseType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    user: JwtPayload,
    filters?: { storeId?: string; warehouseType?: WarehouseType },
  ) {
    const storeId = user.storeId ?? filters?.storeId;
    if (user.storeId && filters?.storeId && filters.storeId !== user.storeId) {
      throw new ForbiddenException('Cannot view another store inventory');
    }

    return this.prisma.inventory.findMany({
      where: {
        ...(filters?.warehouseType && { warehouseType: filters.warehouseType }),
        ...(storeId && { storeId }),
        ...(!storeId && !filters?.warehouseType ? {} : {}),
      },
      include: {
        sku: {
          include: {
            product: { select: { id: true, name: true, skuCode: true } },
          },
        },
        store: { select: { id: true, code: true, name: true } },
        batches: { orderBy: { expiryDate: 'asc' }, take: 5 },
      },
      orderBy: [{ warehouseType: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  async findLowStock(user: JwtPayload) {
    const storeId = user.storeId;
    if (!storeId && !user.storeId) {
      // HQ: all stores with low stock
      const rules = await this.prisma.safetyStockRule.findMany({
        where: { isActive: true },
        include: {
          store: { select: { id: true, code: true, name: true } },
          sku: {
            include: { product: { select: { name: true, skuCode: true } } },
          },
        },
      });

      const results = [];
      for (const rule of rules) {
        const inv = await this.prisma.inventory.findUnique({
          where: {
            skuId_locationKey: { skuId: rule.skuId, locationKey: rule.storeId },
          },
        });
        const qty = inv?.quantity ?? 0;
        if (qty < rule.safetyThreshold) {
          results.push({
            store: rule.store,
            sku: {
              id: rule.sku.id,
              skuVariantCode: rule.sku.skuVariantCode,
              flavour: rule.sku.flavour,
              product: rule.sku.product,
            },
            quantity: qty,
            safetyThreshold: rule.safetyThreshold,
            reorderQty: rule.reorderQty,
            isLowStock: true,
          });
        }
      }
      return results;
    }

    const targetStoreId = storeId ?? user.storeId!;
    const rules = await this.prisma.safetyStockRule.findMany({
      where: { storeId: targetStoreId, isActive: true },
      include: {
        sku: {
          include: { product: { select: { name: true, skuCode: true } } },
        },
      },
    });

    const results = [];
    for (const rule of rules) {
      const inv = await this.prisma.inventory.findUnique({
        where: {
          skuId_locationKey: { skuId: rule.skuId, locationKey: targetStoreId },
        },
      });
      const qty = inv?.quantity ?? 0;
      if (qty < rule.safetyThreshold) {
        results.push({
          sku: {
            id: rule.sku.id,
            skuVariantCode: rule.sku.skuVariantCode,
            flavour: rule.sku.flavour,
            product: rule.sku.product,
          },
          quantity: qty,
          safetyThreshold: rule.safetyThreshold,
          reorderQty: rule.reorderQty,
          isLowStock: true,
        });
      }
    }
    return results;
  }
}
