import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

const FALLBACK_RATES: Record<string, number> = {
  EUR: 0.92,
  CAD: 1.36,
  RMB: 7.24,
  GBP: 0.79,
  AUD: 1.52,
};

@Injectable()
export class ExchangeRateService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async getRate(targetCurrency: string): Promise<number> {
    const target = targetCurrency.toUpperCase();
    if (target === 'USD') return 1;

    const cached = await this.prisma.exchangeRate.findUnique({
      where: {
        baseCurrency_targetCurrency: { baseCurrency: 'USD', targetCurrency: target },
      },
    });
    if (cached) {
      return Number(cached.rate);
    }

    const fallback = FALLBACK_RATES[target];
    if (fallback) {
      await this.prisma.exchangeRate.upsert({
        where: {
          baseCurrency_targetCurrency: { baseCurrency: 'USD', targetCurrency: target },
        },
        create: { baseCurrency: 'USD', targetCurrency: target, rate: fallback, source: 'fallback' },
        update: { rate: fallback, fetchedAt: new Date() },
      });
      return fallback;
    }

    throw new NotFoundException(`Exchange rate for ${target} not available`);
  }

  async refreshRates(): Promise<{ updated: string[] }> {
    const url = this.config.get<string>('EXCHANGE_RATE_API_URL');
    const updated: string[] = [];

    if (url) {
      try {
        const res = await fetch(url);
        const data = (await res.json()) as { rates?: Record<string, number> };
        if (data.rates) {
          for (const [currency, rate] of Object.entries(data.rates)) {
            if (currency === 'USD') continue;
            await this.prisma.exchangeRate.upsert({
              where: {
                baseCurrency_targetCurrency: {
                  baseCurrency: 'USD',
                  targetCurrency: currency,
                },
              },
              create: {
                baseCurrency: 'USD',
                targetCurrency: currency,
                rate,
                source: 'exchangerate_api',
              },
              update: { rate, fetchedAt: new Date(), source: 'exchangerate_api' },
            });
            updated.push(currency);
          }
          return { updated };
        }
      } catch {
        // fall through to defaults
      }
    }

    for (const [currency, rate] of Object.entries(FALLBACK_RATES)) {
      await this.prisma.exchangeRate.upsert({
        where: {
          baseCurrency_targetCurrency: { baseCurrency: 'USD', targetCurrency: currency },
        },
        create: { baseCurrency: 'USD', targetCurrency: currency, rate, source: 'mock_api' },
        update: { rate, fetchedAt: new Date() },
      });
      updated.push(currency);
    }
    return { updated };
  }

  convertUsdToLocal(amountUsd: number, rate: number): number {
    return Math.round(amountUsd * rate * 100) / 100;
  }
}
