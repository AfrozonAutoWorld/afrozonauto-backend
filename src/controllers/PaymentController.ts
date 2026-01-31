import { inject, injectable } from 'inversify';
import { Request, Response } from 'express';
import { TYPES } from '../config/types';
import { asyncHandler } from '../utils/asyncHandler';
import { PaymentService } from '../services/PaymentService';
import { AuthenticatedRequest } from '../types/customRequest';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { OrderService } from '../services/OrderService';
import { Prisma } from '../generated/prisma/client';


@injectable()
export class PaymentController {

    constructor(
        @inject(TYPES.PaymentService)
        private paymentService: PaymentService,
        @inject(TYPES.OrderService) private orderServices: OrderService,
    ) { }

    initPayment = asyncHandler(async (req: AuthenticatedRequest, res) => {
        if (!req.user) {
            return res.status(403).json(
                ApiError.unauthorized('User not authenticated')
            )
        }
        
        const order = await this.orderServices.getOrderById(req.body.orderId);
        
        if (!order) {
            return res.status(404).json(
                ApiError.notFound("Order not found")
            );
        } 
        if (!order.vehicleSnapshot) {
            return res.status(400).json(
                ApiError.badRequest("Order is missing vehicle snapshot data")
            );
        }
        
        // Type guard to ensure it's an object
        const vehicleSnapshot = order.vehicleSnapshot as Prisma.JsonObject;
        
        // if (typeof vehicleSnapshot.originalPriceUsd !== 'number') {
        //     return res.status(400).json(
        //         ApiError.badRequest("Invalid vehicle snapshot data")
        //     );
        // }
        
        const result = await this.paymentService.initiatePayment({
            orderId: req.body.orderId,
            userId: req.user.id,
            email: req.user.email,
            // amountUsd: 1000 || (vehicleSnapshot.originalPriceUsd ?? vehicleSnapshot.priceUsd) as number,
            amountUsd: 1000,
            provider: req.body.provider,
            paymentType: req.body.paymentType,
            currency: vehicleSnapshot.currency as string || 'USD',
            callbackUrl:  req.body.callbackUrl,
            shippingMethod: order.shippingMethod
        });
        
        return res.status(200).json(
            ApiResponse.success(result)
        );
    });
    verifyPayment = asyncHandler(async (req: AuthenticatedRequest, res) => {
        if (!req.user) {
            return res.status(403).json(
                ApiError.unauthorized('User not authenticated')
            )
        }
        
        const { reference } = req.params;
        const { provider } = req.query;
  
        if (!reference) {
          return res.status(400).json(
            ApiError.badRequest('Payment reference is required')
          );
        }
  
        if (!provider || (provider !== 'paystack' && provider !== 'stripe')) {
          return res.status(400).json(
            ApiError.badRequest('Valid payment provider is required (paystack or stripe)')
          );
        }
        
   
        const result = await this.paymentService.verifyPayment(
            reference,
            provider as 'paystack' | 'stripe'
          );
    
          return res.status(200).json(
            ApiResponse.success(result, 'Payment verification completed')
          );
    
    });
    paystackWebhook = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const reference = req.body.data.reference;
        await this.paymentService.handlePaymentSuccess(reference, 'paystack');
        return res.status(200).json(
            ApiResponse.success(
                {}
            )
        );
    });

    stripeWebhook = asyncHandler(async (req, res) => {
        const reference = req.body.data.object.metadata.reference;
        const payment = await this.paymentService.handlePaymentSuccess(reference, 'stripe');
        return res.status(200).json(
            ApiResponse.success(
                payment
            )
        );
    });
    getAllPayments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const payments = await this.paymentService.getPayments()
        return res.status(200).json(
            ApiResponse.success(
                payments
            )
        );
    });
    getAllUserPayments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        if (!req.user) {
            return res.status(401).json(
              ApiError.unauthorized('User not authenticated')
            )
          }
          const userId = req.user.id;
        const payments = await this.paymentService.getUserPayments(userId)
        return res.status(200).json(
            ApiResponse.success(
                payments
            )
        );
    });
    getPaymentById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const id = req.params.id
        const payment = await this.paymentService.getPaymentById(id)
        return res.status(200).json(
            ApiResponse.success(
                payment
            )
        );
    });
}
