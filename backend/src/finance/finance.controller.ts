import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExchangeRateService } from './exchange-rate.service';

@ApiTags('exchange-rates')
@Controller('exchange-rates')
export class FinanceController {
  constructor(private rates: ExchangeRateService) {}

  @Get(':currency')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getRate(@Param('currency') currency: string) {
    const rate = await this.rates.getRate(currency);
    return { baseCurrency: 'USD', targetCurrency: currency.toUpperCase(), rate };
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.hq_admin)
  @ApiBearerAuth()
  refresh() {
    return this.rates.refreshRates();
  }
}
