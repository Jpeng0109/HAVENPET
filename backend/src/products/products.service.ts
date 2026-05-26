import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WarehouseType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateSkuDto } from './dto/create-sku.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateSkuDto } from './dto/update-sku.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(includeInactive = false) {
    return this.prisma.product.findMany({
      where: includeInactive ? undefined : { isActive: true },
      include: {
        skus: {
          where: includeInactive ? undefined : { isActive: true },
          orderBy: { skuVariantCode: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { skus: { orderBy: { skuVariantCode: 'asc' } } },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async create(dto: CreateProductDto) {
    const exists = await this.prisma.product.findUnique({
      where: { skuCode: dto.skuCode },
    });
    if (exists) {
      throw new ConflictException(`Product code ${dto.skuCode} already exists`);
    }
    return this.prisma.product.create({
      data: {
        skuCode: dto.skuCode,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        brand: dto.brand ?? 'HAVENPET',
        basePriceUsd: dto.basePriceUsd,
        basePriceRmb: dto.basePriceRmb,
        supplierName: dto.supplierName,
        supplierContact: dto.supplierContact,
        imageUrl: dto.imageUrl,
      },
      include: { skus: true },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    if (dto.skuCode) {
      const conflict = await this.prisma.product.findFirst({
        where: { skuCode: dto.skuCode, NOT: { id } },
      });
      if (conflict) {
        throw new ConflictException(`Product code ${dto.skuCode} already exists`);
      }
    }
    return this.prisma.product.update({
      where: { id },
      data: dto,
      include: { skus: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async createSku(productId: string, dto: CreateSkuDto) {
    const product = await this.findOne(productId);
    const exists = await this.prisma.sku.findUnique({
      where: { skuVariantCode: dto.skuVariantCode },
    });
    if (exists) {
      throw new ConflictException(`SKU ${dto.skuVariantCode} already exists`);
    }

    const sku = await this.prisma.sku.create({
      data: {
        productId: product.id,
        skuVariantCode: dto.skuVariantCode,
        flavour: dto.flavour,
        weightKg: dto.weightKg,
        weightLabel: dto.weightLabel,
        barcode: dto.barcode,
        priceUsd: dto.priceUsd,
        priceRmb: dto.priceRmb,
        shelfLifeDays: dto.shelfLifeDays,
      },
    });

    if (dto.initialHqStock && dto.initialHqStock > 0) {
      await this.prisma.inventory.create({
        data: {
          skuId: sku.id,
          warehouseType: WarehouseType.hq_central,
          locationKey: 'hq',
          quantity: dto.initialHqStock,
        },
      });
    }

    return sku;
  }

  async updateSku(skuId: string, dto: UpdateSkuDto) {
    const sku = await this.prisma.sku.findUnique({ where: { id: skuId } });
    if (!sku) {
      throw new NotFoundException('SKU not found');
    }
    if (dto.skuVariantCode) {
      const conflict = await this.prisma.sku.findFirst({
        where: { skuVariantCode: dto.skuVariantCode, NOT: { id: skuId } },
      });
      if (conflict) {
        throw new ConflictException(`SKU ${dto.skuVariantCode} already exists`);
      }
    }
    const { initialHqStock: _, ...updateData } = dto;
    return this.prisma.sku.update({
      where: { id: skuId },
      data: updateData,
    });
  }

  async removeSku(skuId: string) {
    const sku = await this.prisma.sku.findUnique({ where: { id: skuId } });
    if (!sku) {
      throw new NotFoundException('SKU not found');
    }
    return this.prisma.sku.update({
      where: { id: skuId },
      data: { isActive: false },
    });
  }
}
