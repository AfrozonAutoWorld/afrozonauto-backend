export interface PaymentInitResult {
    authorizationUrl?: string;
    accessCode?: string;
    clientSecret?: string;
    reference: string;
    amountNgn: number;
    pricing: any;
    calculation?: {
      totalAmountUsd: number;
      paymentAmount: number;
      depositPercentage: number;
      isDeposit: boolean;
      remainingBalance: number;
      paymentType: string;
    };
  }
  
  export interface IPaymentProvider {
    initializePayment(data: {
      amount: number;
      currency: string;
      email: string;
      reference: string;
      metadata?: any;
    }): Promise<PaymentInitResult>;
  
    verifyPayment(reference: string): Promise<{
      success: boolean;
      providerTransactionId: string;
      receiptUrl?: string;
      raw: any;
    }>;
  }
  