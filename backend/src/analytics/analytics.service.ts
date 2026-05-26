import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const REVENUE_STATUSES: OrderStatus[] = [
  OrderStatus.paid_awaiting_shipment,
  OrderStatus.shipped_in_transit,
  OrderStatus.customs_clearance,
  OrderStatus.arrived_at_store,
  OrderStatus.completed,
];

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const [orders, stores, storeSales, pendingFulfillment] = await Promise.all([
      this.prisma.order.findMany({
        where: { status: { in: REVENUE_STATUSES } },
        include: {
          items: { include: { sku: { include: { product: true } } } },
          store: {
            select: {
              id: true,
              code: true,
              name: true,
              currency: true,
              city: true,
              country: true,
              latitude: true,
              longitude: true,
            },
          },
        },
      }),
      this.prisma.store.findMany({ where: { isActive: true } }),
      this.prisma.storeSaleRecord.findMany({
        orderBy: { soldAt: 'desc' },
        take: 500,
      }),
      this.prisma.order.count({
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
      }),
    ]);

    const skuIds = [...new Set(storeSales.map((s) => s.skuId).filter((id): id is string => !!id))];
    const skus = await this.prisma.sku.findMany({
      where: { id: { in: skuIds } },
      include: { product: { select: { name: true } } },
    });
    const skuById = Object.fromEntries(skus.map((s) => [s.id, s]));
    const salesWithSku = storeSales.map((s) => ({
      ...s,
      sku: s.skuId ? skuById[s.skuId] : undefined,
    }));

    const b2bGmvUsd = orders.reduce((sum, o) => sum + Number(o.subtotalUsd), 0);
    const retailGmvUsd = storeSales.reduce((sum, s) => sum + Number(s.revenueUsd), 0);
    const totalGmvUsd = Math.round((b2bGmvUsd + retailGmvUsd) * 100) / 100;

    return {
      kpis: {
        totalGmvUsd,
        b2bGmvUsd: Math.round(b2bGmvUsd * 100) / 100,
        retailGmvUsd: Math.round(retailGmvUsd * 100) / 100,
        totalOrders: orders.length,
        activeStores: stores.length,
        pendingFulfillment,
        completedOrders: orders.filter((o) => o.status === OrderStatus.completed).length,
      },
      salesTrend: this.buildSalesTrend(orders, storeSales),
      topSkus: this.buildTopSkus(orders, salesWithSku),
      storeRanking: this.buildStoreRanking(orders, storeSales, stores),
      storeMap: this.buildStoreMap(stores, orders, storeSales),
    };
  }

  private buildSalesTrend(
    orders: { subtotalUsd: unknown; paidAt: Date | null; createdAt: Date }[],
    sales: { revenueUsd: unknown; soldAt: Date }[],
  ) {
    const months: Record<string, { month: string; gmvUsd: number; orderCount: number }> = {};

    const addMonth = (date: Date, amount: number, isOrder: boolean) => {
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!months[key]) {
        months[key] = { month: key, gmvUsd: 0, orderCount: 0 };
      }
      months[key].gmvUsd += amount;
      if (isOrder) months[key].orderCount += 1;
    };

    for (const o of orders) {
      addMonth(o.paidAt ?? o.createdAt, Number(o.subtotalUsd), true);
    }
    for (const s of sales) {
      addMonth(s.soldAt, Number(s.revenueUsd), false);
    }

    return Object.values(months)
      .map((m) => ({ ...m, gmvUsd: Math.round(m.gmvUsd * 100) / 100 }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-8);
  }

  private buildTopSkus(
    orders: {
      items: {
        skuId: string;
        quantity: number;
        lineTotalUsd: unknown;
        sku: { skuVariantCode: string; product: { name: string } };
      }[];
    }[],
    sales: {
      skuId: string | null;
      quantity: number;
      revenueUsd: unknown;
      sku?: { skuVariantCode: string; product: { name: string } };
    }[],
  ) {
    const skuMap: Record<
      string,
      { skuVariantCode: string; productName: string; quantity: number; revenueUsd: number }
    > = {};

    for (const order of orders) {
      for (const item of order.items) {
        const key = item.skuId;
        if (!skuMap[key]) {
          skuMap[key] = {
            skuVariantCode: item.sku.skuVariantCode,
            productName: item.sku.product.name,
            quantity: 0,
            revenueUsd: 0,
          };
        }
        skuMap[key].quantity += item.quantity;
        skuMap[key].revenueUsd += Number(item.lineTotalUsd);
      }
    }

    for (const sale of sales) {
      if (!sale.skuId || !sale.sku) continue;
      if (!skuMap[sale.skuId]) {
        skuMap[sale.skuId] = {
          skuVariantCode: sale.sku.skuVariantCode,
          productName: sale.sku.product.name,
          quantity: 0,
          revenueUsd: 0,
        };
      }
      skuMap[sale.skuId].quantity += sale.quantity;
      skuMap[sale.skuId].revenueUsd += Number(sale.revenueUsd);
    }

    return Object.values(skuMap)
      .map((s) => ({ ...s, revenueUsd: Math.round(s.revenueUsd * 100) / 100 }))
      .sort((a, b) => b.revenueUsd - a.revenueUsd)
      .slice(0, 8);
  }

  private buildStoreRanking(
    orders: { storeId: string; subtotalUsd: unknown; store: { code: string; name: string; currency: string } }[],
    sales: { storeId: string; revenueUsd: unknown }[],
    stores: { id: string; code: string; name: string; currency: string }[],
  ) {
    const map: Record<
      string,
      { storeCode: string; storeName: string; currency: string; revenueUsd: number; orderCount: number }
    > = {};

    for (const store of stores) {
      map[store.id] = {
        storeCode: store.code,
        storeName: store.name,
        currency: store.currency,
        revenueUsd: 0,
        orderCount: 0,
      };
    }

    for (const o of orders) {
      if (!map[o.storeId]) continue;
      map[o.storeId].revenueUsd += Number(o.subtotalUsd);
      map[o.storeId].orderCount += 1;
    }

    for (const s of sales) {
      if (!map[s.storeId]) continue;
      map[s.storeId].revenueUsd += Number(s.revenueUsd);
    }

    return Object.values(map)
      .map((s) => ({ ...s, revenueUsd: Math.round(s.revenueUsd * 100) / 100 }))
      .sort((a, b) => b.revenueUsd - a.revenueUsd);
  }

  private buildStoreMap(
    stores: {
      id: string;
      code: string;
      name: string;
      city: string;
      country: string;
      latitude: number | null;
      longitude: number | null;
    }[],
    orders: { storeId: string; subtotalUsd: unknown }[],
    sales: { storeId: string; revenueUsd: unknown }[],
  ) {
    const revenueByStore: Record<string, number> = {};
    for (const o of orders) {
      revenueByStore[o.storeId] = (revenueByStore[o.storeId] ?? 0) + Number(o.subtotalUsd);
    }
    for (const s of sales) {
      revenueByStore[s.storeId] = (revenueByStore[s.storeId] ?? 0) + Number(s.revenueUsd);
    }

    return stores
      .filter((s) => s.latitude != null && s.longitude != null)
      .map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        city: s.city,
        country: s.country,
        latitude: s.latitude!,
        longitude: s.longitude!,
        revenueUsd: Math.round((revenueByStore[s.id] ?? 0) * 100) / 100,
      }));
  }
}
