import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InventoryMovementType,
  OrderStatus,
  ShipmentMilestone,
  WarehouseType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { AddMilestoneDto } from './dto/add-milestone.dto';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';

const STATUS_FLOW: Record<OrderStatus, OrderStatus | null> = {
  [OrderStatus.draft]: null,
  [OrderStatus.pending_payment]: null,
  [OrderStatus.paid_awaiting_shipment]: null,
  [OrderStatus.shipped_in_transit]: OrderStatus.customs_clearance,
  [OrderStatus.customs_clearance]: OrderStatus.arrived_at_store,
  [OrderStatus.arrived_at_store]: OrderStatus.completed,
  [OrderStatus.completed]: null,
  [OrderStatus.refunded]: null,
  [OrderStatus.cancelled]: null,
};

const ADVANCE_MILESTONE: Partial<Record<OrderStatus, ShipmentMilestone>> = {
  [OrderStatus.shipped_in_transit]: ShipmentMilestone.customs_clearance,
  [OrderStatus.customs_clearance]: ShipmentMilestone.arrived_at_destination,
  [OrderStatus.arrived_at_store]: ShipmentMilestone.delivered_to_store,
};

const MILESTONE_LABELS: Record<ShipmentMilestone, string> = {
  [ShipmentMilestone.order_confirmed]: 'Order Confirmed',
  [ShipmentMilestone.packed_at_hq]: 'Packed at HQ Warehouse',
  [ShipmentMilestone.departed_origin]: 'Departed Origin Port',
  [ShipmentMilestone.in_transit]: 'In Transit',
  [ShipmentMilestone.customs_clearance]: 'Customs Clearance',
  [ShipmentMilestone.arrived_at_destination]: 'Arrived at Destination Port',
  [ShipmentMilestone.delivered_to_store]: 'Delivered to Store',
};

@Injectable()
export class ShipmentsService {
  constructor(private prisma: PrismaService) {}

  async listFulfillmentOrders() {
    return this.prisma.order.findMany({
      where: {
        status: {
          in: [
            OrderStatus.paid_awaiting_shipment,
            OrderStatus.shipped_in_transit,
            OrderStatus.customs_clearance,
            OrderStatus.arrived_at_store,
          ],
        },
      },
      include: shipmentInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  async getTracking(orderId: string, user: JwtPayload) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: shipmentInclude,
    });
    if (!order) throw new NotFoundException('Order not found');
    if (user.storeId && order.storeId !== user.storeId) {
      throw new ForbiddenException('Access denied');
    }
    return this.buildTrackingResponse(order);
  }

  async ship(dto: CreateShipmentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { shipment: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.paid_awaiting_shipment) {
      throw new BadRequestException('Order must be paid and awaiting shipment');
    }
    if (order.shipment) {
      throw new BadRequestException('Shipment already exists for this order');
    }

    const now = new Date();
    const shipment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.shipment.create({
        data: {
          orderId: order.id,
          carrier: dto.carrier,
          trackingNumber: dto.trackingNumber,
          containerId: dto.containerId,
          vesselFlight: dto.vesselFlight,
          originPort: dto.originPort,
          destinationPort: dto.destinationPort,
          estimatedArrival: dto.estimatedArrival ? new Date(dto.estimatedArrival) : null,
          customsNotes: dto.customsNotes,
        },
      });

      const milestones: { milestone: ShipmentMilestone; title: string; location?: string }[] = [
        { milestone: ShipmentMilestone.order_confirmed, title: MILESTONE_LABELS.order_confirmed },
        { milestone: ShipmentMilestone.packed_at_hq, title: MILESTONE_LABELS.packed_at_hq, location: 'HAVENPET HQ' },
        {
          milestone: ShipmentMilestone.departed_origin,
          title: MILESTONE_LABELS.departed_origin,
          location: dto.originPort ?? 'Origin Port',
        },
        {
          milestone: ShipmentMilestone.in_transit,
          title: `${MILESTONE_LABELS.in_transit} — ${dto.carrier}`,
          location: dto.vesselFlight ?? 'International Waters',
        },
      ];

      for (const m of milestones) {
        await tx.shipmentMilestoneRecord.create({
          data: {
            shipmentId: created.id,
            milestone: m.milestone,
            title: m.title,
            location: m.location,
            occurredAt: now,
          },
        });
      }

      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.shipped_in_transit, shippedAt: now },
      });

      return created;
    });

    return this.getTracking(order.id, { sub: '', email: '', role: 'hq_admin', storeId: null });
  }

  async updateShipment(shipmentId: string, dto: UpdateShipmentDto) {
    const shipment = await this.prisma.shipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) throw new NotFoundException('Shipment not found');

    await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        ...dto,
        estimatedArrival: dto.estimatedArrival ? new Date(dto.estimatedArrival) : undefined,
      },
    });

    return this.getTracking(shipment.orderId, { sub: '', email: '', role: 'hq_admin', storeId: null });
  }

  async addMilestone(orderId: string, dto: AddMilestoneDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { shipment: true },
    });
    if (!order?.shipment) {
      throw new NotFoundException('Shipment not found for this order');
    }

    await this.prisma.shipmentMilestoneRecord.create({
      data: {
        shipmentId: order.shipment.id,
        milestone: dto.milestone,
        title: dto.title,
        description: dto.description,
        location: dto.location,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
      },
    });

    return this.getTracking(orderId, { sub: '', email: '', role: 'hq_admin', storeId: null });
  }

  async advanceStatus(orderId: string, notes?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { shipment: true, items: true, store: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (!order.shipment) {
      throw new BadRequestException('Create shipment before advancing status');
    }

    const nextStatus = STATUS_FLOW[order.status];
    if (!nextStatus) {
      throw new BadRequestException(`Cannot advance from status ${order.status}`);
    }

    const milestoneType = ADVANCE_MILESTONE[order.status];
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      if (milestoneType) {
        await tx.shipmentMilestoneRecord.create({
          data: {
            shipmentId: order.shipment!.id,
            milestone: milestoneType,
            title: MILESTONE_LABELS[milestoneType],
            description: notes,
            location: order.store.city,
            occurredAt: now,
          },
        });
      }

      if (nextStatus === OrderStatus.customs_clearance && notes) {
        await tx.shipment.update({
          where: { id: order.shipment!.id },
          data: { customsNotes: notes },
        });
      }

      const orderUpdate: { status: OrderStatus; completedAt?: Date } = { status: nextStatus };
      if (nextStatus === OrderStatus.completed) {
        orderUpdate.completedAt = now;
        await this.transferInventoryToStore(tx, order.id, order.storeId, order.items);
      }

      await tx.order.update({ where: { id: orderId }, data: orderUpdate });
    });

    return this.getTracking(orderId, { sub: '', email: '', role: 'hq_admin', storeId: null });
  }

  private async transferInventoryToStore(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    orderId: string,
    storeId: string,
    items: { skuId: string; quantity: number }[],
  ) {
    for (const item of items) {
      await tx.inventory.updateMany({
        where: { skuId: item.skuId, locationKey: 'hq' },
        data: {
          quantity: { decrement: item.quantity },
          reservedQty: { decrement: item.quantity },
        },
      });

      await tx.inventory.upsert({
        where: {
          skuId_locationKey: { skuId: item.skuId, locationKey: storeId },
        },
        create: {
          skuId: item.skuId,
          warehouseType: WarehouseType.store_retail,
          storeId,
          locationKey: storeId,
          quantity: item.quantity,
        },
        update: { quantity: { increment: item.quantity } },
      });

      await tx.inventoryMovement.create({
        data: {
          skuId: item.skuId,
          storeId,
          warehouseType: WarehouseType.store_retail,
          movementType: InventoryMovementType.restock,
          quantity: item.quantity,
          referenceId: orderId,
          notes: 'B2B order delivered — stock received at store',
        },
      });
    }
  }

  private buildTrackingResponse(order: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    currency: string;
    totalAmount: unknown;
    shippedAt: Date | null;
    completedAt: Date | null;
    store?: { code: string; name: string; city: string } | null;
    shipment?: {
      carrier: string | null;
      trackingNumber: string | null;
      containerId: string | null;
      vesselFlight: string | null;
      originPort: string | null;
      destinationPort: string | null;
      estimatedArrival: Date | null;
      customsNotes: string | null;
      milestones?: Array<{
        id: string;
        milestone: ShipmentMilestone;
        title: string;
        description: string | null;
        location: string | null;
        occurredAt: Date;
      }>;
    } | null;
  }) {
    const milestones = order.shipment?.milestones ?? [];
    const sorted = [...milestones].sort(
      (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
    );

    const steps: OrderStatus[] = [
      OrderStatus.paid_awaiting_shipment,
      OrderStatus.shipped_in_transit,
      OrderStatus.customs_clearance,
      OrderStatus.arrived_at_store,
      OrderStatus.completed,
    ];

    const currentIdx = steps.indexOf(order.status);

    return {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        store: order.store,
        totalAmount: order.totalAmount,
        currency: order.currency,
        shippedAt: order.shippedAt,
        completedAt: order.completedAt,
      },
      shipment: order.shipment,
      timeline: sorted.map((m) => ({
        id: m.id,
        milestone: m.milestone,
        title: m.title,
        description: m.description,
        location: m.location,
        occurredAt: m.occurredAt,
      })),
      progress: {
        currentStep: currentIdx >= 0 ? currentIdx : 0,
        totalSteps: steps.length,
        steps: steps.map((s, i) => ({
          status: s,
          label: s.replace(/_/g, ' '),
          completed: i <= currentIdx,
          active: i === currentIdx,
        })),
      },
    };
  }
}

export const shipmentInclude = {
  store: { select: { id: true, code: true, name: true, city: true, country: true } },
  items: {
    include: {
      sku: { include: { product: { select: { name: true, skuCode: true } } } },
    },
  },
  shipment: {
    include: {
      milestones: { orderBy: { occurredAt: 'asc' as const } },
    },
  },
};
