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
import { PaymentStatus, ShippingMethod } from '../generated/prisma/enums';
import { VehicleServiceDirect } from '../services/VehicleServiceDirect';
import { PricingConfigService } from '../services/PricingConfigService';


@injectable()
export class PaymentController {

    constructor(
        @inject(TYPES.PaymentService)
        private paymentService: PaymentService,
        @inject(TYPES.OrderService) private orderServices: OrderService,
        @inject(TYPES.VehicleService) private vehicleService: VehicleServiceDirect,
        @inject(TYPES.PricingConfigService) private pricingService: PricingConfigService,
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

        const vehiclePriceUsd = (vehicleSnapshot.originalPriceUsd ?? vehicleSnapshot.priceUsd) as number;
        if (!vehiclePriceUsd) {
            return res.status(400).json(
                ApiError.badRequest("Vehicle snapshot is missing price data")
            );
        }

        const result = await this.paymentService.initiatePayment({
            orderId: req.body.orderId,
            userId: req.user.id,
            email: req.user.email,
            amountUsd: vehiclePriceUsd,
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
    getAllPayments = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
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

    getAdminPayments = asyncHandler(async (req: Request, res: Response) => {
        const page  = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
        const search = (req.query.search as string)?.trim() || undefined;
        const statusParam = (req.query.status as string)?.toUpperCase();
        const status = statusParam && statusParam !== 'ALL' && Object.values(PaymentStatus).includes(statusParam as PaymentStatus)
            ? (statusParam as PaymentStatus)
            : undefined;

        const result = await this.paymentService.getAdminPayments({ status, search, page, limit });

        return res.status(200).json(
            ApiResponse.paginated(
                result.payments,
                { page: result.page, limit: result.limit, total: result.total, pages: result.pages },
                'Payments retrieved successfully'
            )
        );
    });

    getPaymentStats = asyncHandler(async (_req: Request, res: Response) => {
        const stats = await this.paymentService.getPaymentStats();
        return res.status(200).json(ApiResponse.success(stats, 'Payment statistics retrieved'));
    });

    // ─── Bank Transfer: one-shot (create order + payment + attach evidence) ──
    initiateBankTransfer = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        if (!req.user) return res.status(401).json(ApiError.unauthorized('Not authenticated'));

        const {
            identifier, type, vehicleId,
            shippingMethod, paymentType = 'DEPOSIT',
            customerNotes, deliveryInstructions, specialRequests,
        } = req.body;

        if (!identifier || !shippingMethod) {
            return res.status(400).json(ApiError.badRequest('identifier and shippingMethod are required'));
        }

        const uploadedFiles: any[] = req.body.uploadedFiles ?? [];
        if (!uploadedFiles.length) return res.status(400).json(ApiError.badRequest('No evidence file uploaded'));

        // 1. Fetch vehicle
        const vehicle = await this.vehicleService.getVehicle(identifier, type ?? 'id');
        if (!vehicle) return res.status(404).json(ApiError.notFound('Vehicle not found'));

        // 2. Calculate pricing breakdown
        const paymentBreakdown = await this.pricingService.calculateTotalUsd(
            (vehicle.originalPriceUsd ?? vehicle.priceUsd) as number,
            shippingMethod as ShippingMethod,
        );

        // 3. Create order (PENDING_QUOTE)
        const order = await this.orderServices.createOrder({
            userId: req.user.id,
            vehicleId: vehicleId ?? vehicle.id,
            shippingMethod,
            vehicleSnapshot: vehicle as any,
            paymentBreakdown,
            customerNotes,
            deliveryInstructions,
            specialRequests,
        });

        // 4. Create payment record + attach evidence → status PROCESSING
        const { url, publicId } = uploadedFiles[0];
        const payment = await this.paymentService.uploadPaymentEvidence(
            order.id, req.user.id, url, publicId, paymentType,
        );

        return res.status(201).json(
            ApiResponse.success({ order, payment }, 'Order and payment evidence submitted. Awaiting admin confirmation.'),
        );
    });

    // ─── Bank Transfer Evidence (existing order) ─────────────────────────────
    uploadEvidence = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        if (!req.user) return res.status(401).json(ApiError.unauthorized('Not authenticated'));
        const { orderId } = req.params;
        const paymentType = req.body.paymentType ?? 'DEPOSIT';
        const uploadedFiles: any[] = req.body.uploadedFiles ?? [];
        if (!uploadedFiles.length) return res.status(400).json(ApiError.badRequest('No evidence file uploaded'));
        const { url, publicId } = uploadedFiles[0];
        const payment = await this.paymentService.uploadPaymentEvidence(orderId, req.user.id, url, publicId, paymentType);
        return res.status(200).json(ApiResponse.success(payment, 'Payment evidence uploaded. Awaiting admin confirmation.'));
    });

    // ─── Admin Confirm / Reject ─────────────────────────────────────────────

    confirmPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        if (!req.user) return res.status(401).json(ApiError.unauthorized('Not authenticated'));
        const { id } = req.params;
        const { note } = req.body;

        const payment = await this.paymentService.adminConfirmPayment(id, req.user.id, note);
        return res.status(200).json(ApiResponse.success(payment, 'Payment confirmed and order status updated'));
    });

    rejectPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        if (!req.user) return res.status(401).json(ApiError.unauthorized('Not authenticated'));
        const { id } = req.params;
        const { note } = req.body;
        if (!note) return res.status(400).json(ApiError.badRequest('Rejection reason (note) is required'));

        const payment = await this.paymentService.adminRejectPayment(id, req.user.id, note);
        return res.status(200).json(ApiResponse.success(payment, 'Payment evidence rejected'));
    });
}
