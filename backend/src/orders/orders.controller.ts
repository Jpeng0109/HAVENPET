import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreateOrderDto } from './dto/create-order.dto';
import { PreviewOrderDto } from './dto/preview-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @Get('catalog')
  @UseGuards(RolesGuard)
  @Roles(UserRole.store_manager)
  getCatalog(@CurrentUser() user: JwtPayload) {
    return this.orders.getCatalog(user);
  }

  @Post('orders/preview')
  @UseGuards(RolesGuard)
  @Roles(UserRole.store_manager)
  preview(@CurrentUser() user: JwtPayload, @Body() dto: PreviewOrderDto) {
    return this.orders.preview(user, dto);
  }

  @Post('orders')
  @UseGuards(RolesGuard)
  @Roles(UserRole.store_manager)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateOrderDto) {
    return this.orders.create(user, dto);
  }

  @Post('orders/restock/:skuId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.store_manager)
  restock(@CurrentUser() user: JwtPayload, @Param('skuId') skuId: string) {
    return this.orders.createRestockOrder(user, skuId);
  }

  @Get('orders')
  findAll(@CurrentUser() user: JwtPayload) {
    return this.orders.findAll(user);
  }

  @Get('orders/:id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.orders.findOne(id, user);
  }

  @Post('orders/:id/submit')
  @UseGuards(RolesGuard)
  @Roles(UserRole.store_manager)
  submit(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.orders.submit(id, user);
  }

  @Post('orders/:id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.orders.cancel(id, user);
  }
}
