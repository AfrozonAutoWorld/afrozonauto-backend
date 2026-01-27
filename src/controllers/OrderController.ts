import { Request, Response } from 'express';
import { OrderService } from '../services/OrderService';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { OrderStatus, ShippingMethod, OrderPriority } from '../generated/prisma/client';
import { asyncHandler } from '../utils/asyncHandler';


export class OrderController {
  constructor(private service: OrderService) {}

  // ========== CREATE ==========
  
  createOrder = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, "Authentication required");
    }
    
    const {
      vehicleId,
      shippingMethod,
      destinationCountry,
      destinationState,
      destinationCity,
      destinationAddress,
      deliveryInstructions,
      customerNotes,
      specialRequests,
      tags
    } = req.body;
    
    const order = await this.service.createOrder({
      userId,
      vehicleId,
      shippingMethod,
      destinationCountry,
      destinationState,
      destinationCity,
      destinationAddress,
      deliveryInstructions,
      customerNotes,
      specialRequests,
      tags
    });
    
    return res.status(201).json(
      ApiResponse.success(order, "Order created successfully")
    );
  });

  // ========== READ ==========
  
  getOrderById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const order = await this.service.getOrderById(id);
    
    // Check permissions
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'OPERATIONS_ADMIN') {
      if (order.userId !== req.user?.id) {
        throw new ApiError(403, "Access denied");
      }
    }
    
    return res.status(200).json(
      ApiResponse.success(order, "Order retrieved successfully")
    );
  });

  getOrderByRequestNumber = asyncHandler(async (req: Request, res: Response) => {
    const { requestNumber } = req.params;
    const order = await this.service.getOrderByRequestNumber(requestNumber);
    
    // Check permissions
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'OPERATIONS_ADMIN') {
      if (order.userId !== req.user?.id) {
        throw new ApiError(403, "Access denied");
      }
    }
    
    return res.status(200).json(
      ApiResponse.success(order, "Order retrieved successfully")
    );
  });

  getUserOrders = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, "Authentication required");
    }
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await this.service.getUserOrders(userId, page, limit);
    
    return res.status(200).json(
      ApiResponse.success(result, "User orders retrieved successfully")
    );
  });

  // getAllOrders = asyncHandler(async (req: Request, res: Response) => {
  //   // Admin only
  //   if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'OPERATIONS_ADMIN') {
  //     throw new ApiError(403, "Admin access required");
  //   }
    
  //   const {
  //     status,
  //     userId,
  //     vehicleId,
  //     destinationCountry,
  //     destinationState,
  //     shippingMethod,
  //     priority,
  //     tags,
  //     startDate,
  //     endDate,
  //     search,
  //     isCancelled,
  //     isRefunded
  //   } = req.query;
    
  //   const page = parseInt(req.query.page as string) || 1;
  //   const limit = parseInt(req.query.limit as string) || 20;
    
  //   const filters = {
  //     status: status ? (Array.isArray(status) ? status : [status]) as OrderStatus[] : undefined,
  //     userId: userId as string,
  //     vehicleId: vehicleId as string,
  //     destinationCountry: destinationCountry as string,
  //     destinationState: destinationState as string,
  //     shippingMethod: shippingMethod as ShippingMethod,
  //     priority: priority as OrderPriority,
  //     tags: tags ? (Array.isArray(tags) ? tags : [tags]) as string[] : undefined,
  //     startDate: startDate ? new Date(startDate as string) : undefined,
  //     endDate: endDate ? new Date(endDate as string) : undefined,
  //     search: search as string,
  //     isCancelled: isCancelled ? isCancelled === 'true' : undefined,
  //     isRefunded: isRefunded ? isRefunded === 'true' : undefined
  //   };
    
  //   const result = await this.service.getAllOrders(filters, page, limit);
    
  //   return res.status(200).json(
  //     ApiResponse.success(result, "Orders retrieved successfully")
  //   );
  // });

  // ========== UPDATE ==========
  
  updateOrder = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const order = await this.service.getOrderById(id);
    
    // Check permissions
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'OPERATIONS_ADMIN') {
      if (order.userId !== req.user?.id) {
        throw new ApiError(403, "Access denied");
      }
    }
    
    const {
      shippingMethod,
      destinationCountry,
      destinationState,
      destinationCity,
      destinationAddress,
      deliveryInstructions,
      customerNotes,
      specialRequests,
      estimatedDeliveryDate,
      priority,
      tags
    } = req.body;
    
    const updatedOrder = await this.service.updateOrder(id, {
      shippingMethod,
      destinationCountry,
      destinationState,
      destinationCity,
      destinationAddress,
      deliveryInstructions,
      customerNotes,
      specialRequests,
      estimatedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : undefined,
      priority,
      tags
    });
    
    return res.status(200).json(
      ApiResponse.success(updatedOrder, "Order updated successfully")
    );
  });

  updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
    // Admin only
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'OPERATIONS_ADMIN') {
      throw new ApiError(403, "Admin access required");
    }
    
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !Object.values(OrderStatus).includes(status)) {
      throw new ApiError(400, "Invalid status");
    }
    
    const updatedOrder = await this.service.updateOrderStatus(
      id, 
      status as OrderStatus, 
      req.user.id
    );
    
    return res.status(200).json(
      ApiResponse.success(updatedOrder, "Order status updated successfully")
    );
  });

  bulkUpdateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
    // Admin only
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'OPERATIONS_ADMIN') {
        return res.status(400).json(ApiError.unauthorized("Admin access required"));
    }
    
    const { ids, status } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json(ApiError.notFound("IDs array is required"));
    }
    
    if (!status || !Object.values(OrderStatus).includes(status)) {
        return res.status(400).json (ApiError.badRequest("Invalid status, kindly supply a valid status"));
    }
    
    const result = await this.service.bulkUpdateOrderStatus(
      ids, 
      status as OrderStatus, 
      req.user.id
    );
    
    return res.status(200).json(
      ApiResponse.success(result, "Orders status updated successfully")
    );
  });

  updateOrderPriority = asyncHandler(async (req: Request, res: Response) => {
    // Admin only
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'OPERATIONS_ADMIN') {
      throw new ApiError(403, "Admin access required");
    }
    
    const { id } = req.params;
    const { priority } = req.body;
    
    if (!priority || !Object.values(OrderPriority).includes(priority)) {
      throw new ApiError(400, "Invalid priority");
    }
    
    const updatedOrder = await this.service.updateOrderPriority(id, priority as OrderPriority);
    
    return res.status(200).json(
      ApiResponse.success(updatedOrder, "Order priority updated successfully")
    );
  });

  assignOrderTags = asyncHandler(async (req: Request, res: Response) => {
    // Admin only
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'OPERATIONS_ADMIN') {
      throw new ApiError(403, "Admin access required");
    }
    
    const { id } = req.params;
    const { tags } = req.body;
    
    if (!tags || !Array.isArray(tags)) {
      throw new ApiError(400, "Tags array is required");
    }
    
    const updatedOrder = await this.service.assignOrderTags(id, tags);
    
    return res.status(200).json(
      ApiResponse.success(updatedOrder, "Order tags updated successfully")
    );
  });

  cancelOrder = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
        return res.status(400).json(
            ApiError.badRequest("Cancellation reason is required")
        )
    }
    
    const order = await this.service.getOrderById(id);
    
    // Check permissions
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'OPERATIONS_ADMIN') {
      if (order.userId !== req.user?.id) {
        throw new ApiError(403, "Access denied");
      }
    }
    
    const cancelledBy = req.user?.id || 'system';
    const updatedOrder = await this.service.cancelOrder(id, reason, cancelledBy);
    
    return res.status(200).json(
      ApiResponse.success(updatedOrder, "Order cancelled successfully")
    );
  });

  requestRefund = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      throw new ApiError(400, "Refund reason is required");
    }
    
    const order = await this.service.getOrderById(id);
    
    // Check permissions
    if (order.userId !== req.user?.id) {
      throw new ApiError(403, "Access denied");
    }
    
    const updatedOrder = await this.service.requestRefund(id, reason);
    
    return res.status(200).json(
      ApiResponse.success(updatedOrder, "Refund requested successfully")
    );
  });

  // ========== ADMIN OPERATIONS ==========
  
  addAdminNote = asyncHandler(async (req: Request, res: Response) => {
    // Admin only
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'OPERATIONS_ADMIN') {
      throw new ApiError(403, "Admin access required");
    }
    
    const { id } = req.params;
    const { note, isInternal = true, category } = req.body;
    
    if (!note) {
      throw new ApiError(400, "Note content is required");
    }
    
    const adminNote = await this.service.addAdminNote(
      id, 
      note, 
      req.user.id, 
      isInternal, 
      category
    );
    
    return res.status(201).json(
      ApiResponse.success(adminNote, "Admin note added successfully")
    );
  });

  getAdminNotes = asyncHandler(async (req: Request, res: Response) => {
    // Admin only
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'OPERATIONS_ADMIN') {
      throw new ApiError(403, "Admin access required");
    }
    
    const { id } = req.params;
    const notes = await this.service.getAdminNotes(id);
    
    return res.status(200).json(
      ApiResponse.success(notes, "Admin notes retrieved successfully")
    );
  });

  // ========== STATISTICS ==========
  
  // getOrderStats = asyncHandler(async (req: Request, res: Response) => {
  //   // Admin only
  //   if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'OPERATIONS_ADMIN') {
  //     throw new ApiError(403, "Admin access required");
  //   }
    
  //   const {
  //     startDate,
  //     endDate,
  //     destinationCountry,
  //     status
  //   } = req.query;
    
  //   const filters = {
  //     startDate: startDate ? new Date(startDate as string) : undefined,
  //     endDate: endDate ? new Date(endDate as string) : undefined,
  //     destinationCountry: destinationCountry as string,
  //     status: status as OrderStatus
  //   };
    
  //   const stats = await this.service.getOrderStats(filters);
    
  //   return res.status(200).json(
  //     ApiResponse.success(stats, "Order statistics retrieved successfully")
  //   );
  // });

  getStatusCounts = asyncHandler(async (req: Request, res: Response) => {
    // Admin only
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'OPERATIONS_ADMIN') {
      throw new ApiError(403, "Admin access required");
    }
    
    const counts = await this.service.getStatusCounts();
    
    return res.status(200).json(
      ApiResponse.success(counts, "Status counts retrieved successfully")
    );
  });

  getRevenueStats = asyncHandler(async (req: Request, res: Response) => {
    // Admin only
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'OPERATIONS_ADMIN') {
      throw new ApiError(403, "Admin access required");
    }
    
    const { startDate, endDate } = req.query;
    
    const stats = await this.service.getRevenueStats(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    
    return res.status(200).json(
      ApiResponse.success(stats, "Revenue statistics retrieved successfully")
    );
  });

  // ========== DELETE ==========
  
  deleteOrder = asyncHandler(async (req: Request, res: Response) => {
    // Admin only
    if (req.user?.role !== 'SUPER_ADMIN') {
      throw new ApiError(403, "Super admin access required");
    }
    
    const { id } = req.params;
    const success = await this.service.delete(id);
    
    if (!success) {
      throw new ApiError(404, "Order not found or already deleted");
    }
    
    return res.status(200).json(
      ApiResponse.success(null, "Order deleted successfully")
    );
  });

  softDeleteOrder = asyncHandler(async (req: Request, res: Response) => {
    // Admin only
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'OPERATIONS_ADMIN') {
      throw new ApiError(403, "Admin access required");
    }
    
    const { id } = req.params;
    const order = await this.service.softDelete(id);
    
    return res.status(200).json(
      ApiResponse.success(order, "Order cancelled (soft delete) successfully")
    );
  });
}