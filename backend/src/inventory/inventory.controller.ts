import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { WarehouseType } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { InventoryService } from './inventory.service';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private inventory: InventoryService) {}

  @Get('low-stock')
  findLowStock(@CurrentUser() user: JwtPayload) {
    return this.inventory.findLowStock(user);
  }

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('storeId') storeId?: string,
    @Query('warehouseType') warehouseType?: WarehouseType,
  ) {
    return this.inventory.findAll(user, { storeId, warehouseType });
  }
}
