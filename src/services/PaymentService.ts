import { inject, injectable } from 'inversify';
import { PaymentRepository } from '../repositories/PaymentRepository';
import { OrderRepository } from '../repositories/OrderRepository';
import { IPaymentProvider } from '../validation/interfaces/IPaymentProvider';
import { TYPES } from '../config/types';
import prisma from '../db';
import { PricingConfigService } from './PricingConfigService';
import { OrderStatus, PaymentStatus, PaymentType } from '../generated/prisma/enums';
import { NotificationService } from './NotificationService';
import { DEPOSIT_PERCENTAGE } from '../secrets';

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
    private paystack: IPaymentProvider,

    @inject(TYPES.NotificationService)
    private notificationService: NotificationService,
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
    // Use the actual payable amount from provider calculation, fall back to raw amountUsd
    const payableAmount = result.calculation?.paymentAmount ?? payload.amountUsd;

    // Create payment record with calculation data if available
    const paymentData: any = {
      orderId: payload.orderId,
      userId: payload.userId,
      amountUsd: payableAmount,
      paymentType: payload.paymentType,
      paymentProvider: payload.provider,
      status: PaymentStatus.PENDING,
      transactionRef: reference,
      localCurrency: payload.currency
    };

    // Add calculation metadata if available
    if (result.calculation) {
      paymentData.metadata = {
        vehiclePriceUsd: payload.amountUsd,
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
    if (!payment || payment.status === PaymentStatus.COMPLETED) return;

    const providerClient =
      provider === 'stripe' ? this.stripe : this.paystack;

    const verification = await providerClient.verifyPayment(reference);
    if (!verification.success) return;



    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { transactionRef: reference },
        data: {
          status: PaymentStatus.COMPLETED,
          providerTransactionId: String(verification.providerTransactionId),
          receiptUrl: verification.receiptUrl ?? null,
          completedAt: new Date(),
          escrowStatus: 'HELD'
        }
      });

      const order = await tx.order.findUnique({ where: { id: payment.orderId } });
      const payments = await tx.payment.findMany({ where: { orderId: payment.orderId, status: PaymentStatus.COMPLETED } });
      const totalCompleted = payments.reduce((sum, p) => sum + (p.amountUsd || 0), 0);
      
      const breakdown = order?.paymentBreakdown as Record<string, any> | null;
      const totalUsd = breakdown?.totalUsd as number | undefined;
      
      let newStatus: OrderStatus = order?.status || OrderStatus.PENDING_QUOTE;
      if (totalUsd) {
        const expectedDeposit = (breakdown?.totalUsedDeposit as number) ?? (totalUsd * Number(DEPOSIT_PERCENTAGE));
        if (totalCompleted >= totalUsd) {
           newStatus = OrderStatus.BALANCE_PAID;
        } else if (totalCompleted >= expectedDeposit) {
           newStatus = OrderStatus.DEPOSIT_PAID;
        } else if (totalCompleted > 0) {
           newStatus = OrderStatus.HALF_DEPOSIT_PAID;
        }
      }

      const remainingUsd = totalUsd ? Math.max(0, totalUsd - totalCompleted) : undefined;

      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          status: newStatus,
          amountPaidUsd: totalCompleted,
          amountRemainingUsd: remainingUsd,
          statusChangedAt: new Date()
        }
      });
    });

    // Fire-and-forget admin notification
    this.notificationService.notifyAdminsPaymentReceived({
      orderId: payment.orderId,
      orderRef: payment.orderId,
      customerName: payment.userId,
      amountUsd: payment.amountUsd,
    }).catch(() => {/* silent */ });
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

  async getAdminPayments(filters: {
    status?: PaymentStatus;
    search?: string;
    page: number;
    limit: number;
  }) {
    const skip = (filters.page - 1) * filters.limit;
    const { payments, total } = await this.paymentRepo.findAdminPaginated(
      { status: filters.status, search: filters.search },
      { skip, take: filters.limit }
    );

    return {
      payments,
      total,
      page: filters.page,
      limit: filters.limit,
      pages: Math.ceil(total / filters.limit),
    };
  }

  getPaymentStats() {
    return this.paymentRepo.getStats();
  }

  // ─── Bank Transfer Evidence ───────────────────────────────────────────────

  async uploadPaymentEvidence(
    orderId: string,
    userId: string,
    evidenceUrls: string[],
    evidencePublicIds: string[],
    paymentType: string = 'DEPOSIT',
    transferredAmountUsd?: number,
  ) {
    // Verify order belongs to user
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });
    if (order.userId !== userId) throw Object.assign(new Error('Access denied'), { statusCode: 403 });

    // Derive amount from paymentBreakdown (set at order creation via calculateTotalUsd)
    // Fall back to vehicleSnapshot price if breakdown is missing
    const breakdown = order.paymentBreakdown as Record<string, any> | null;
    const snapshot = order.vehicleSnapshot as Record<string, any>;
    const vehiclePriceUsd = (snapshot?.originalPriceUsd ?? snapshot?.priceUsd ?? 0) as number;

    let amountUsd: number;
    if (breakdown?.totalUsd) {
      if (paymentType === 'FULL_PAYMENT') {
        amountUsd = breakdown.totalUsd as number;
      } else if (paymentType === 'BALANCE') {
        const deposit = (breakdown.totalUsedDeposit as number) ?? (Number(breakdown.totalUsd) * Number(DEPOSIT_PERCENTAGE));
        amountUsd = Number(breakdown.totalUsd) - deposit;
      } else {
        // Assume DEPOSIT
        amountUsd = (breakdown.totalUsedDeposit as number) ?? (Number(breakdown.totalUsd) * Number(DEPOSIT_PERCENTAGE));
      }
    } else {
      amountUsd = vehiclePriceUsd;
    }

    return this.paymentRepo.createBankTransferWithEvidence({
      orderId,
      userId,
      paymentType,
      amountUsd: transferredAmountUsd || amountUsd,
      evidenceUrls,
      evidencePublicIds,
    });
  }

  // ─── Admin Confirm / Reject ───────────────────────────────────────────────

  async adminConfirmAllOrderPayments(orderId: string, adminId: string, note?: string) {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });

    // Find all manual payments for this order that need confirmation
    const allPayments = await prisma.payment.findMany({
      where: { orderId, paymentMethod: 'BANK_TRANSFER', status: { in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING] } }
    });

    if (allPayments.length === 0) {
       // If no pending manual payments, maybe check if we just want to re-evaluate the order status
       // but usually this is called when there ARE payments to confirm.
    }

    const paymentIds = allPayments.map(p => p.id);
    const totalBeingConfirmed = allPayments.reduce((sum, p) => sum + (p.amountUsd || 0), 0);

    // Perform batch confirmation
    if (paymentIds.length > 0) {
      await this.paymentRepo.batchConfirmPayments(paymentIds, adminId, note);
    }

    // Now re-calculate order status based on ALL completed payments
    const totalCompleted = await this.paymentRepo.getCompletedTotalUsdForOrder(orderId);
    const breakdown = order.paymentBreakdown as Record<string, any> | null;
    const totalUsd = breakdown?.totalUsd as number | undefined;

    let newStatus: OrderStatus = order.status;

    if (totalUsd) {
      const expectedDeposit = (breakdown?.totalUsedDeposit as number) ?? (totalUsd * Number(DEPOSIT_PERCENTAGE));
      
      if (totalCompleted >= totalUsd) {
        newStatus = OrderStatus.BALANCE_PAID;
      } else if (totalCompleted >= expectedDeposit) {
        newStatus = OrderStatus.DEPOSIT_PAID;
      } else if (totalCompleted > 0) {
        newStatus = OrderStatus.HALF_DEPOSIT_PAID;
      }
    }

    const remainingUsd = totalUsd ? Math.max(0, totalUsd - totalCompleted) : undefined;
    await this.orderRepo.updateOrderStatusAndAmounts(
      orderId, 
      newStatus, 
      totalCompleted, 
      remainingUsd
    );

    return { 
      message: `Confirmed ${allPayments.length} payments. New order status: ${newStatus}`,
      totalConfirmed: totalCompleted,
      orderStatus: newStatus
    };
  }
  
  async adminConfirmPayment(paymentId: string, adminId: string, note?: string) {
    const payment = await this.paymentRepo.findPaymentWithOrder(paymentId);
    if (!payment) throw Object.assign(new Error('Payment not found'), { statusCode: 404 });
    if (!['PROCESSING', 'PENDING'].includes(payment.status)) {
      throw Object.assign(new Error('Only pending/processing payments can be confirmed'), { statusCode: 400 });
    }

    const confirmedPayment = await this.paymentRepo.adminConfirmSinglePayment(paymentId, adminId, note);

    // Now re-calculate order status based on ALL completed payments
    const order = payment.order as any;
    const totalCompleted = await this.paymentRepo.getCompletedTotalUsdForOrder(payment.orderId);
    const breakdown = order.paymentBreakdown;
    const totalUsd = breakdown?.totalUsd;

    let newStatus: OrderStatus = order.status;

    if (totalUsd) {
      const expectedDeposit = (breakdown?.totalUsedDeposit as number) ?? (totalUsd * Number(DEPOSIT_PERCENTAGE));
      
      if (totalCompleted >= totalUsd) {
        newStatus = OrderStatus.BALANCE_PAID;
      } else if (totalCompleted >= expectedDeposit) {
        newStatus = OrderStatus.DEPOSIT_PAID;
      } else if (totalCompleted > 0) {
        newStatus = OrderStatus.HALF_DEPOSIT_PAID;
      }
    }

    const remainingUsd = totalUsd ? Math.max(0, totalUsd - totalCompleted) : undefined;
    await this.orderRepo.updateOrderStatusAndAmounts(
      payment.orderId, 
      newStatus, 
      totalCompleted, 
      remainingUsd
    );

    await this.notificationService.notifyBuyerPaymentConfirmed({
      userId: payment.user.id,
      userEmail: payment.user.email,
      orderId: payment.orderId,
      orderRef: order.requestNumber,
      amountUsd: payment.amountUsd,
      paymentRef: payment.transactionRef
    });

    return {
      message: `Confirmed payment. New order status: ${newStatus}`,
      payment: confirmedPayment,
      totalConfirmed: totalCompleted,
      orderStatus: newStatus
    };
  }

  async adminRejectPayment(paymentId: string, adminId: string, note: string) {
    const payment = await this.paymentRepo.findPaymentWithOrder(paymentId);
    if (!payment) throw Object.assign(new Error('Payment not found'), { statusCode: 404 });
    if (!['PROCESSING', 'PENDING'].includes(payment.status)) {
      throw Object.assign(new Error('Only pending/processing payments can be rejected'), { statusCode: 400 });
    }

    return this.paymentRepo.adminRejectPayment(paymentId, adminId, note);
  }

  // ─── Admin Notify Seller ──────────────────────────────────────────────────

  async notifySellerOfCompletePayment(paymentId: string) {
    const payment = await this.paymentRepo.findById(paymentId);
    if (!payment) throw Object.assign(new Error('Payment not found'), { statusCode: 404 });

    // Accept either status if business allows, but generally should be COMPLETED
    if (payment.status !== PaymentStatus.COMPLETED) {
      throw Object.assign(new Error('Payment must be COMPLETED before notifying the seller'), { statusCode: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: payment.orderId },
      include: {
        vehicle: {
          include: {
            user: true
          }
        }
      }
    });

    if (!order || !order.vehicle || !order.vehicle.userId || !order.vehicle.user) {
      throw Object.assign(new Error('Seller not found for this vehicle/order'), { statusCode: 404 });
    }

    if (payment.paymentType === PaymentType.DEPOSIT && order.status !== OrderStatus.BALANCE_PAID) {
      throw Object.assign(new Error('This payment is a deposit. Vehicle must be fully paid before notifying the seller.'), { statusCode: 400 });
    }

    const seller = order.vehicle.user;
    const vehicleName = `${order.vehicle.year} ${order.vehicle.make} ${order.vehicle.model}`;

    await this.notificationService.notifySellerPaymentComplete({
      userId: seller.id,
      userEmail: seller.email,
      orderId: order.id,
      orderRef: order.requestNumber,
      amountUsd: payment.amountUsd,
      vehicleName
    });

    return { message: "Seller notified successfully via email and in-app notification" };
  }
}
