import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoresService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: JwtPayload) {
    if (user.storeId) {
      const store = await this.prisma.store.findFirst({
        where: { id: user.storeId, isActive: true },
      });
      return store ? [store] : [];
    }
    return this.prisma.store.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, user: JwtPayload) {
    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store || !store.isActive) {
      throw new NotFoundException('Store not found');
    }
    this.assertStoreAccess(store.id, user);
    return store;
  }

  async create(dto: CreateStoreDto) {
    const exists = await this.prisma.store.findUnique({ where: { code: dto.code } });
    if (exists) {
      throw new ConflictException(`Store code ${dto.code} already exists`);
    }
    return this.prisma.store.create({
      data: {
        code: dto.code,
        name: dto.name,
        country: dto.country,
        city: dto.city,
        address: dto.address,
        postalCode: dto.postalCode,
        latitude: dto.latitude,
        longitude: dto.longitude,
        contactName: dto.contactName,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        currency: dto.currency.toUpperCase(),
        taxRate: dto.taxRate ?? 0,
        importDutyRate: dto.importDutyRate ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdateStoreDto) {
    await this.findOneOrThrow(id);
    if (dto.code) {
      const conflict = await this.prisma.store.findFirst({
        where: { code: dto.code, NOT: { id } },
      });
      if (conflict) {
        throw new ConflictException(`Store code ${dto.code} already exists`);
      }
    }
    return this.prisma.store.update({
      where: { id },
      data: {
        ...dto,
        currency: dto.currency?.toUpperCase(),
      },
    });
  }

  async remove(id: string) {
    await this.findOneOrThrow(id);
    return this.prisma.store.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private async findOneOrThrow(id: string) {
    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store || !store.isActive) {
      throw new NotFoundException('Store not found');
    }
    return store;
  }

  private assertStoreAccess(storeId: string, user: JwtPayload) {
    if (user.storeId && user.storeId !== storeId) {
      throw new ForbiddenException('Access denied to this store');
    }
  }
}
