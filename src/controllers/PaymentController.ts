import { inject, injectable } from 'inversify';
import { Request, Response } from 'express';
import { TYPES } from '../config/types';
import { asyncHandler } from '../utils/asyncHandler';
import { PaymentService } from '../services/PaymentService';
import { AuthenticatedRequest } from '../types/customRequest';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';


@injectable()
export class PaymentController {

    constructor(
        @inject(TYPES.PaymentService)
        private paymentService: PaymentService
    ) { }

    initPayment = asyncHandler(async (req: AuthenticatedRequest, res) => {
        if (!req.user) {
            throw ApiError.unauthorized('User not authenticated');
        }
        const result = await this.paymentService.initiatePayment({
            orderId: req.body.orderId,
            userId: req.user.id,
            email: req.user.email,
            amountUsd: req.body.amountUsd,
            provider: req.body.provider,
            paymentType: req.body.paymentType
        });

        return res.status(200).json(
            ApiResponse.success(
                result
            )
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
        await this.paymentService.handlePaymentSuccess(reference, 'stripe');
        return res.status(200).json(
            ApiResponse.success(
                {}
            )
        );
    });
}
