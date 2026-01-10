export interface PaymentInitResult {
    authorizationUrl?: string;
    clientSecret?: string;
    reference: string;
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
  