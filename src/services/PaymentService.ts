import { inject, injectable } from 'inversify';
import { PaymentRepository } from '../repositories/PaymentRepository';
import { OrderRepository } from '../repositories/OrderRepository';
import { IPaymentProvider } from '../validation/interfaces/IPaymentProvider';
import { TYPES } from '../config/types';
import prisma from '../db';
import { date } from 'joi/lib';
import { PricingConfigService } from './PricingConfigService';
import { PaymentStatus, PaymentType } from '../generated/prisma/enums';

@injectable()
export class PaymentService {

  constructor(
    @inject(TYPES.PaymentRepository)
    private paymentRepo: PaymentRepository,

    @inject(TYPES.OrderRepository)
    private orderRepo: OrderRepository,

    @inject(TYPES.PricingConfigService)
    private pricingService: PricingConfigService,

    @inject(TYPES.StripeProvider)
    private stripe: IPaymentProvider,

    @inject(TYPES.PaystackProvider)
    private paystack: IPaymentProvider
  ) { }

  async initiatePayment(payload: {
    orderId: string;
    userId: string;
    email: string;
    amountUsd: number;
    provider: 'stripe' | 'paystack';
    currency: string;
    callbackUrl: string;
    shippingMethod: string;
    paymentType: PaymentType;
  }) {

    const reference = `AFZ-${Date.now()}`;

    const provider =
      payload.provider === 'stripe' ? this.stripe : this.paystack;

    const result = await provider.initializePayment({
      amount: payload.amountUsd,
      currency: payload.currency,
      email: payload.email,
      reference,
      metadata: { orderId: payload.orderId, callbackUrl: payload.callbackUrl, shippingMethod: payload.shippingMethod, paymentType: payload.paymentType }
    });
    // Create payment record with calculation data if available
    const paymentData: any = {
      orderId: payload.orderId,
      userId: payload.userId,
      amountUsd: payload.amountUsd,
      paymentType: payload.paymentType,
      paymentProvider: payload.provider,
      status: PaymentStatus.PENDING,
      transactionRef: reference,
      localCurrency: payload.currency
    };

    // Add calculation metadata if available
    if (result.calculation) {
      paymentData.metadata = {
        calculation: result.calculation,
        isDeposit: result.calculation.isDeposit,
        depositPercentage: result.calculation.depositPercentage,
        remainingBalance: result.calculation.remainingBalance
      };
    }

    await this.paymentRepo.createPayment(paymentData);

    return {
      ...result,
      ...paymentData.metadata
    }
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

  /**
  * Verify payment (frontend verification)
  */
  async verifyPayment(reference: string, provider: 'stripe' | 'paystack') {
    // Get payment record
    const payment = await this.paymentRepo.findByReference(reference);

    if (!payment) {
      throw new Error('Payment not found');
    }

    // If already completed, return current status
    if (payment.status === 'COMPLETED') {
      return {
        success: true,
        payment,
        message: 'Payment already completed'
      };
    }

    // Get provider client
    const providerClient = provider === 'stripe' ? this.stripe : this.paystack;

    // Verify with provider
    const verification = await providerClient.verifyPayment(reference);

    // Update payment based on verification
    if (verification.success) {
      // await this.handleSuccessfulVerification(payment, verification, provider);
      await this.handlePaymentSuccess(reference, provider);

      return {
        success: true,
        payment: await this.paymentRepo.findByReference(reference),
        verification,
        message: 'Payment verified successfully'
      };
    } else {
      await this.paymentRepo.updatePayment(payment.id, {
        status: 'FAILED',
        metadata: {
          failureReason: 'Verification failed',
          provider: provider,
          providerResponse: verification
        }
      });


      return {
        success: false,
        payment: await this.paymentRepo.findByReference(reference),
        verification,
        message: 'Payment verification failed'
      };
    }
  }

  getPayments = () => {
    return this.paymentRepo.findAll()
  }
  getUserPayments = (userId: string) => {
    return this.paymentRepo.findAllUserPayments(userId)
  }
  getPaymentById = (id: string) => {
    return this.paymentRepo.findById(id)
  }


}
