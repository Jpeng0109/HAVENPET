import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { AddMilestoneDto } from './dto/add-milestone.dto';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { ShipmentsService } from './shipments.service';

@ApiTags('shipments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('shipments')
export class ShipmentsController {
  constructor(private shipments: ShipmentsService) {}

  @Get('fulfillment')
  @UseGuards(RolesGuard)
  @Roles(UserRole.hq_admin)
  listFulfillment() {
    return this.shipments.listFulfillmentOrders();
  }

  @Get('track/:orderId')
  track(@Param('orderId') orderId: string, @CurrentUser() user: JwtPayload) {
    return this.shipments.getTracking(orderId, user);
  }

  @Post('ship')
  @UseGuards(RolesGuard)
  @Roles(UserRole.hq_admin)
  ship(@Body() dto: CreateShipmentDto) {
    return this.shipments.ship(dto);
  }

  @Patch(':shipmentId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.hq_admin)
  update(@Param('shipmentId') shipmentId: string, @Body() dto: UpdateShipmentDto) {
    return this.shipments.updateShipment(shipmentId, dto);
  }

  @Post(':orderId/milestones')
  @UseGuards(RolesGuard)
  @Roles(UserRole.hq_admin)
  addMilestone(@Param('orderId') orderId: string, @Body() dto: AddMilestoneDto) {
    return this.shipments.addMilestone(orderId, dto);
  }

  @Post(':orderId/advance')
  @UseGuards(RolesGuard)
  @Roles(UserRole.hq_admin)
  advance(@Param('orderId') orderId: string, @Body('notes') notes?: string) {
    return this.shipments.advanceStatus(orderId, notes);
  }
}
