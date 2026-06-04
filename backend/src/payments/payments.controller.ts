import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.store_manager)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreatePaymentDto) {
    return this.payments.create(user, dto);
  }

  @Get('pending-wire')
  @UseGuards(RolesGuard)
  @Roles(UserRole.hq_admin)
  pendingWire() {
    return this.payments.findPendingWire();
  }

  @Post(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.hq_admin)
  approve(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.payments.approveWire(id, user);
  }

  @Post(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.hq_admin)
  reject(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.payments.rejectWire(id, reason);
  }
}
