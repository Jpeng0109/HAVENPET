import { PrismaClient, UserRole, WarehouseType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding HAVENPET database...');

  const storeBerlin = await prisma.store.upsert({
    where: { code: 'DE-BERLIN-01' },
    update: {},
    create: {
      code: 'DE-BERLIN-01',
      name: 'HAVENPET Berlin',
      country: 'Germany',
      city: 'Berlin',
      address: 'Friedrichstraße 100',
      postalCode: '10117',
      latitude: 52.52,
      longitude: 13.405,
      contactName: 'Klaus Weber',
      contactEmail: 'berlin@havenpet.de',
      contactPhone: '+49 30 1234567',
      currency: 'EUR',
      taxRate: 0.19,
      importDutyRate: 0.05,
    },
  });

  const storeToronto = await prisma.store.upsert({
    where: { code: 'CA-TORONTO-01' },
    update: {},
    create: {
      code: 'CA-TORONTO-01',
      name: 'HAVENPET Toronto',
      country: 'Canada',
      city: 'Toronto',
      address: '100 Queen St W',
      postalCode: 'M5H 2N2',
      latitude: 43.6532,
      longitude: -79.3832,
      contactName: 'Sarah Chen',
      contactEmail: 'toronto@havenpet.ca',
      currency: 'CAD',
      taxRate: 0.13,
      importDutyRate: 0.08,
    },
  });

  const passwordHash = await bcrypt.hash('Admin123!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@havenpet.com' },
    update: {},
    create: {
      email: 'admin@havenpet.com',
      passwordHash,
      firstName: 'HQ',
      lastName: 'Admin',
      role: UserRole.hq_admin,
    },
  });

  const storePasswordHash = await bcrypt.hash('Store123!', 12);
  await prisma.user.upsert({
    where: { email: 'store.de@havenpet.com' },
    update: {},
    create: {
      email: 'store.de@havenpet.com',
      passwordHash: storePasswordHash,
      firstName: 'Klaus',
      lastName: 'Weber',
      role: UserRole.store_manager,
      storeId: storeBerlin.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'store.ca@havenpet.com' },
    update: {},
    create: {
      email: 'store.ca@havenpet.com',
      passwordHash: storePasswordHash,
      firstName: 'Sarah',
      lastName: 'Chen',
      role: UserRole.store_manager,
      storeId: storeToronto.id,
    },
  });

  const product = await prisma.product.upsert({
    where: { skuCode: 'HVP-PREMIUM-DRY' },
    update: {},
    create: {
      skuCode: 'HVP-PREMIUM-DRY',
      name: 'HAVENPET Premium Dry Food',
      description: 'High-protein grain-free dry food for adult dogs',
      category: 'dry_food',
      basePriceUsd: 45.0,
      basePriceRmb: 320.0,
      supplierName: 'HAVENPET Manufacturing Co.',
      supplierContact: 'supply@havenpet.com',
    },
  });

  const skuSalmon12 = await prisma.sku.upsert({
    where: { skuVariantCode: 'HVP-SALMON-12KG' },
    update: {},
    create: {
      productId: product.id,
      skuVariantCode: 'HVP-SALMON-12KG',
      flavour: 'Salmon',
      weightKg: 12,
      weightLabel: '12kg',
      priceUsd: 89.99,
      priceRmb: 640.0,
      shelfLifeDays: 540,
    },
  });

  const skuChicken2 = await prisma.sku.upsert({
    where: { skuVariantCode: 'HVP-CHICKEN-2KG' },
    update: {},
    create: {
      productId: product.id,
      skuVariantCode: 'HVP-CHICKEN-2KG',
      flavour: 'Chicken',
      weightKg: 2,
      weightLabel: '2kg',
      priceUsd: 24.99,
      priceRmb: 178.0,
      shelfLifeDays: 540,
    },
  });

  const hqInvSalmon = await prisma.inventory.upsert({
    where: {
      skuId_locationKey: { skuId: skuSalmon12.id, locationKey: 'hq' },
    },
    update: { quantity: 500 },
    create: {
      skuId: skuSalmon12.id,
      warehouseType: WarehouseType.hq_central,
      locationKey: 'hq',
      quantity: 500,
    },
  });

  await prisma.inventoryBatch.deleteMany({ where: { inventoryId: hqInvSalmon.id } });
  await prisma.inventoryBatch.createMany({
    data: [
      {
        inventoryId: hqInvSalmon.id,
        skuId: skuSalmon12.id,
        batchNumber: 'BATCH-2025-001',
        quantity: 300,
        expiryDate: new Date('2026-12-31'),
      },
      {
        inventoryId: hqInvSalmon.id,
        skuId: skuSalmon12.id,
        batchNumber: 'BATCH-2025-002',
        quantity: 200,
        expiryDate: new Date('2027-03-31'),
      },
    ],
  });

  await prisma.inventory.upsert({
    where: {
      skuId_locationKey: { skuId: skuSalmon12.id, locationKey: storeBerlin.id },
    },
    update: { quantity: 8 },
    create: {
      skuId: skuSalmon12.id,
      warehouseType: WarehouseType.store_retail,
      storeId: storeBerlin.id,
      locationKey: storeBerlin.id,
      quantity: 8,
    },
  });

  await prisma.safetyStockRule.upsert({
    where: { storeId_skuId: { storeId: storeBerlin.id, skuId: skuSalmon12.id } },
    update: {},
    create: {
      storeId: storeBerlin.id,
      skuId: skuSalmon12.id,
      safetyThreshold: 15,
      reorderQty: 50,
    },
  });

  await prisma.inventory.upsert({
    where: {
      skuId_locationKey: { skuId: skuChicken2.id, locationKey: storeBerlin.id },
    },
    update: {},
    create: {
      skuId: skuChicken2.id,
      warehouseType: WarehouseType.store_retail,
      storeId: storeBerlin.id,
      locationKey: storeBerlin.id,
      quantity: 45,
    },
  });

  const now = new Date();
  const monthsAgo = (m: number) => new Date(now.getFullYear(), now.getMonth() - m, 15);

  await prisma.storeSaleRecord.deleteMany({});
  await prisma.storeSaleRecord.createMany({
    data: [
      { storeId: storeBerlin.id, skuId: skuSalmon12.id, quantity: 85, revenueUsd: 3200, revenueLocal: 2944, currency: 'EUR', soldAt: monthsAgo(5) },
      { storeId: storeBerlin.id, skuId: skuChicken2.id, quantity: 200, revenueUsd: 1800, revenueLocal: 1656, currency: 'EUR', soldAt: monthsAgo(4) },
      { storeId: storeBerlin.id, skuId: skuSalmon12.id, quantity: 95, revenueUsd: 3600, revenueLocal: 3312, currency: 'EUR', soldAt: monthsAgo(3) },
      { storeId: storeToronto.id, skuId: skuSalmon12.id, quantity: 60, revenueUsd: 2400, revenueLocal: 3264, currency: 'CAD', soldAt: monthsAgo(4) },
      { storeId: storeToronto.id, skuId: skuChicken2.id, quantity: 150, revenueUsd: 1400, revenueLocal: 1904, currency: 'CAD', soldAt: monthsAgo(2) },
      { storeId: storeToronto.id, skuId: skuSalmon12.id, quantity: 70, revenueUsd: 2800, revenueLocal: 3808, currency: 'CAD', soldAt: monthsAgo(1) },
    ],
  });

  await prisma.exchangeRate.createMany({
    data: [
      { baseCurrency: 'USD', targetCurrency: 'EUR', rate: 0.92 },
      { baseCurrency: 'USD', targetCurrency: 'CAD', rate: 1.36 },
      { baseCurrency: 'USD', targetCurrency: 'RMB', rate: 7.24 },
    ],
    skipDuplicates: true,
  });

  console.log('Seed complete.');
  console.log('  HQ Admin: admin@havenpet.com / Admin123!');
  console.log('  Store DE: store.de@havenpet.com / Store123!');
  console.log('  Store CA: store.ca@havenpet.com / Store123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
