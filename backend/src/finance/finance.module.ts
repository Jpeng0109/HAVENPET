import { Global, Module } from '@nestjs/common';
import { ExchangeRateService } from './exchange-rate.service';
import { FinanceController } from './finance.controller';

@Global()
@Module({
  controllers: [FinanceController],
  providers: [ExchangeRateService],
  exports: [ExchangeRateService],
})
export class FinanceModule {}
