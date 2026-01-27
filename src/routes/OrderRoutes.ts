import { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { validateBody } from "../middleware/bodyValidate"
import { AdminNoteSchema, cancelOrder, createOrderSchema, updateOrderSchema } from '../validation/schema/order.validation';
import { OrderController } from '../controllers/OrderController';
import { authorize } from '../middleware/authMiddleware';
import { UserRole } from '../generated/prisma/enums';

class OrderRoutes {
    private router = Router();
    private controller = container.get<OrderController>(TYPES.OrderController);

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {

        // ========== PUBLIC USER ROUTES ==========

        // Create order
        this.router.post('/',
            validateBody(createOrderSchema),
            this.controller.createOrder
        );

        // Get user's orders
        this.router.get('/my-orders', this.controller.getUserOrders);

        // Get specific order by ID
        this.router.get('/:id', this.controller.getOrderById);

        // Get order by request number
        this.router.get('/request/:requestNumber', this.controller.getOrderByRequestNumber);

        // Cancel order
        this.router.post('/:id/cancel',
            validateBody(cancelOrder),
            this.controller.cancelOrder
        );

        // Request refund
        this.router.post('/:id/request-refund',
            validateBody(cancelOrder),
            this.controller.requestRefund
        );

        // Update order (limited fields for users)
        this.router.put('/:id',
            validateBody(updateOrderSchema),
            this.controller.updateOrder
        );

        // ========== ADMIN ROUTES ==========

        this.router.use(authorize([]));

        // Get all orders with filters
        // this.router.get('/', this.controller.getAllOrders);

        // Update order status
        this.router.put('/:id/status',
            authorize([UserRole.OPERATIONS_ADMIN, UserRole.SUPER_ADMIN]),
            this.controller.updateOrderStatus
        );

        // Bulk update order status
        this.router.put('/bulk/status',
            authorize([UserRole.OPERATIONS_ADMIN, UserRole.SUPER_ADMIN]),
            this.controller.bulkUpdateOrderStatus
        );

        // Update order priority
        this.router.put('/:id/priority',
            authorize([UserRole.OPERATIONS_ADMIN, UserRole.SUPER_ADMIN]),
            this.controller.updateOrderPriority
        );

        // Assign tags
        this.router.put('/:id/tags',
            authorize([UserRole.OPERATIONS_ADMIN, UserRole.SUPER_ADMIN]),
            this.controller.assignOrderTags
        );

        // Add admin note
        this.router.post('/:id/notes',
            authorize([UserRole.OPERATIONS_ADMIN, UserRole.SUPER_ADMIN]),
            validateBody(AdminNoteSchema),
            this.controller.addAdminNote
        );

        // Get admin notes
        this.router.get('/:id/notes', authorize([UserRole.OPERATIONS_ADMIN, UserRole.SUPER_ADMIN]), this.controller.getAdminNotes);

        // ========== STATISTICS ROUTES ==========

        // Order statistics
        // this.router.get('/stats/orders', this.controller.getOrderStats);

        // Status counts
        this.router.get('/stats/status-counts', this.controller.getStatusCounts);

        // Revenue statistics
        this.router.get('/stats/revenue', this.controller.getRevenueStats);

        // ========== SUPER ADMIN ROUTES ==========
        // Delete order permanently
        this.router.delete('/:id', authorize([UserRole.SUPER_ADMIN]), this.controller.deleteOrder);
        // Soft delete order
        this.router.delete('/:id/soft', authorize([UserRole.SUPER_ADMIN]),  this.controller.softDeleteOrder);
    }

    public getRouter() {
        return this.router;
    }
}

export default new OrderRoutes().getRouter();