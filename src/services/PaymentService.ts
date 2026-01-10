import { inject, injectable } from 'inversify';
import { PaymentRepository } from '../repositories/PaymentRepository';
import { OrderRepository } from '../repositories/OrderRepository';
import { IPaymentProvider } from '../validation/interfaces/IPaymentProvider';
import { TYPES } from '../config/types';
import prisma from '../db';

@injectable()
export class PaymentService {

  constructor(
    @inject(TYPES.PaymentRepository)
    private paymentRepo: PaymentRepository,

    @inject(TYPES.OrderRepository)
    private orderRepo: OrderRepository,

    @inject(TYPES.StripeProvider)
    private stripe: IPaymentProvider,

    @inject(TYPES.PaystackProvider)
    private paystack: IPaymentProvider
  ) {}

  async initiatePayment(payload: {
    orderId: string;
    userId: string;
    email: string;
    amountUsd: number;
    provider: 'stripe' | 'paystack';
    paymentType: any;
  }) {

    const reference = `AFZ-${Date.now()}`;

    await this.paymentRepo.createPayment({
      orderId: payload.orderId,
      userId: payload.userId,
      amountUsd: payload.amountUsd,
      paymentType: payload.paymentType,
      paymentProvider: payload.provider,
      status: 'PENDING',
      transactionRef: reference
    });

    const provider =
      payload.provider === 'stripe' ? this.stripe : this.paystack;

    return provider.initializePayment({
      amount: payload.amountUsd,
      currency: 'USD',
      email: payload.email,
      reference,
      metadata: { orderId: payload.orderId }
    });
  }

  /**
   * Called from webhook
   */
  async handlePaymentSuccess(reference: string, provider: 'stripe' | 'paystack') {

    const payment = await this.paymentRepo.findByReference(reference);
    if (!payment || payment.status === 'COMPLETED') return;

    const providerClient =
      provider === 'stripe' ? this.stripe : this.paystack;

    const verification = await providerClient.verifyPayment(reference);
    if (!verification.success) return;

    await prisma.$transaction([
      this.paymentRepo.updatePaymentByRef(reference, {
        status: 'COMPLETED',
        providerTransactionId: verification.providerTransactionId,
        receiptUrl: verification.receiptUrl,
        completedAt: new Date(),
        escrowStatus: 'HELD'
      }),

      this.orderRepo.updateOrderStatus(
        payment.orderId,
        payment.paymentType === 'DEPOSIT'
          ? 'DEPOSIT_PAID'
          : 'PAID'
      )
    ]);
  }
}
