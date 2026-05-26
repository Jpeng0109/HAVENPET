import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { OrdersService } from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreatePaymentDto } from './dto/create-payment.dto';

const INSTANT_METHODS: PaymentMethod[] = [
  PaymentMethod.credit_card,
  PaymentMethod.stripe,
  PaymentMethod.paypal,
];

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private ordersService: OrdersService,
  ) {}

  async create(user: JwtPayload, dto: CreatePaymentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { payments: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (user.storeId && order.storeId !== user.storeId) {
      throw new ForbiddenException('Access denied');
    }
    if (order.status !== OrderStatus.pending_payment) {
      throw new BadRequestException('Order must be in pending_payment status');
    }

    const completedPayment = order.payments.find((p) => p.status === PaymentStatus.completed);
    if (completedPayment) {
      throw new BadRequestException('Order already paid');
    }

    if (dto.method === PaymentMethod.bank_wire && !dto.wireReceiptUrl) {
      throw new BadRequestException('wireReceiptUrl is required for bank wire transfers');
    }

    const isInstant = INSTANT_METHODS.includes(dto.method);
    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        method: dto.method,
        status: isInstant ? PaymentStatus.completed : PaymentStatus.pending,
        amount: order.totalAmount,
        currency: order.currency,
        wireReceiptUrl: dto.wireReceiptUrl,
        externalId: isInstant ? `mock_${dto.method}_${Date.now()}` : null,
        approvedAt: isInstant ? new Date() : null,
        metadata: { processedBy: user.sub, mock: true },
      },
    });

    if (isInstant) {
      await this.markOrderPaid(order.id);
    }

    return payment;
  }

  async findPendingWire() {
    return this.prisma.payment.findMany({
      where: { method: PaymentMethod.bank_wire, status: PaymentStatus.pending },
      include: {
        order: {
          include: {
            store: { select: { code: true, name: true } },
            items: { include: { sku: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approveWire(paymentId: string, approver: JwtPayload) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.method !== PaymentMethod.bank_wire) {
      throw new BadRequestException('Only bank wire payments can be approved via this endpoint');
    }
    if (payment.status !== PaymentStatus.pending) {
      throw new BadRequestException('Payment is not pending');
    }

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.completed,
        approvedById: approver.sub,
        approvedAt: new Date(),
      },
    });

    await this.markOrderPaid(payment.orderId);
    return this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });
  }

  async rejectWire(paymentId: string, reason?: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.failed, failureReason: reason ?? 'Rejected by HQ' },
    });
  }

  private async markOrderPaid(orderId: string) {
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.paid_awaiting_shipment,
        paidAt: new Date(),
      },
    });
    await this.ordersService.reserveHqStock(orderId);
  }
}
