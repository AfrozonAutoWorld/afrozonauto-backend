import { injectable, inject } from "inversify";
import { 
  OrderRepository, 
  OrderFilters, 
  OrderStats, 
  RevenueStats 
} from "../repositories/OrderRepository";
import { 
  Order, 
  OrderStatus, 
  ShippingMethod, 
  OrderPriority,
  Prisma 
} from "../generated/prisma/client";
import { TYPES } from "../config/types";
import { ApiError } from "../utils/ApiError";

export interface CreateOrderData {
  userId: string;
  vehicleId?: string;
  shippingMethod: ShippingMethod;
  destinationCountry?: string;
  destinationState?: string;
  destinationCity?: string;
  destinationAddress?: string;
  deliveryInstructions?: string;
  customerNotes?: string;
  specialRequests?: string;
  tags?: string[];
  vehicleSnapshot: Record<string, any>;
  paymentBreakdown: Record<string, any>;
}

export interface UpdateOrderData {
  shippingMethod?: ShippingMethod;
  destinationCountry?: string;
  destinationState?: string;
  destinationCity?: string;
  destinationAddress?: string;
  deliveryInstructions?: string;
  customerNotes?: string;
  specialRequests?: string;
  estimatedDeliveryDate?: Date;
  priority?: OrderPriority;
  tags?: string[];
}

export interface OrderWithDetails extends Order {
  user?: any;
  vehicle?: any;
  payments?: any[];
  inspection?: any;
  shipment?: any;
}

@injectable()
export class OrderService {
  constructor(
    @inject(TYPES.OrderRepository) 
    private orderRepository: OrderRepository
  ) {}

  // ========== CREATE ==========
  
  async createOrder(data: CreateOrderData): Promise<OrderWithDetails> {
    // Generate request number
    const requestNumber = this.generateRequestNumber();
    
    const orderData: Prisma.OrderCreateInput = {
      requestNumber,
      user: { connect: { id: data.userId } },
    ...(data.vehicleId && { 
      vehicle: { connect: { id: data.vehicleId } } 
    }),
      shippingMethod: data.shippingMethod,
      destinationCountry: data.destinationCountry || "Nigeria",
      destinationState: data.destinationState,
      destinationCity: data.destinationCity,
      destinationAddress: data.destinationAddress,
      deliveryInstructions: data.deliveryInstructions,
      customerNotes: data.customerNotes,
      specialRequests: data.specialRequests,
      tags: data.tags || [],
      status: OrderStatus.PENDING_QUOTE,
      vehicleSnapshot: data.vehicleSnapshot,
      paymentBreakdown: data.paymentBreakdown,
    };
    
    return this.orderRepository.create(orderData);
  }

  

  private generateRequestNumber(): string {
    const year = new Date().getFullYear().toString().slice(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(100000 + Math.random() * 900000);
    return `AFZ-${year}-${month}-${random}`;
  }

  // ========== READ ==========

  async getOrderById(id: string): Promise<OrderWithDetails> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new ApiError(404, "Order not found");
    }
    return order;
  }

  async getOrderByRequestNumber(requestNumber: string): Promise<OrderWithDetails> {
    const order = await this.orderRepository.findByRequestNumber(requestNumber);
    if (!order) {
      throw new ApiError(404, "Order not found");
    }
    return order;
  }

  async getUserOrders(userId: string, page = 1, limit = 10): Promise<{
    orders: Order[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.orderRepository.findByUserId(userId, page, limit);
  }

  async getVehicleOrders(vehicleId: string): Promise<Order[]> {
    return this.orderRepository.findByVehicleId(vehicleId);
  }

  // async getAllOrders(filters: OrderFilters, page = 1, limit = 20): Promise<{
  //   orders: Order[];
  //   total: number;
  //   page: number;
  //   limit: number;
  //   totalPages: number;
  //   stats: OrderStats;
  // }> {
  //   return this.orderRepository.findAllWithFilters(filters, page, limit);
  // }
  // delete order
  async delete(id: string) {
    const order = await this.getOrderById(id);
    
    // Check if order can be modified
    if (!order) {
      throw  ApiError.notFound("Order not found");
    }
    
    return this.orderRepository.delete(id);
  }
  async softDelete(id: string) {
    const order = await this.getOrderById(id);
    
    // Check if order can be modified
    if (!order) {
      throw  ApiError.notFound("Order not found");
    }
    
    return this.orderRepository.softDelete(id);
  }

  // ========== UPDATE ==========
  
  async updateOrder(id: string, data: UpdateOrderData): Promise<OrderWithDetails> {
    const order = await this.getOrderById(id);
    
    // Check if order can be modified
    if (this.isOrderLocked(order)) {
      throw new ApiError(400, "Order cannot be modified in its current state");
    }
    
    return this.orderRepository.update(id, data);
  }

  async updateOrderStatus(id: string, status: OrderStatus, adminId?: string): Promise<OrderWithDetails> {
    const order = await this.getOrderById(id);
    
    // Validate status transition
    if (!this.isValidStatusTransition(order.status, status)) {
      throw new ApiError(400, `Invalid status transition from ${order.status} to ${status}`);
    }
    
    return this.orderRepository.updateStatus(id, status, adminId);
  }

  async bulkUpdateOrderStatus(ids: string[], status: OrderStatus, adminId?: string): Promise<{ count: number }> {
    // Validate all orders exist
    const orders = await Promise.all(
      ids.map(id => this.orderRepository.findById(id))
    );
    
    const invalidOrders = orders.filter(order => !order);
    if (invalidOrders.length > 0) {
      throw new ApiError(404, `Some orders not found`);
    }
    
    // Validate status transitions
    for (const order of orders) {
      if (order && !this.isValidStatusTransition(order.status, status)) {
        throw new ApiError(400, `Order ${order.requestNumber} cannot transition from ${order.status} to ${status}`);
      }
    }
    
    return this.orderRepository.bulkUpdateStatus(ids, status, adminId);
  }

  async updateOrderPriority(id: string, priority: OrderPriority): Promise<Order> {
    return this.orderRepository.updatePriority(id, priority);
  }

  async assignOrderTags(id: string, tags: string[]): Promise<Order> {
    return this.orderRepository.assignTags(id, tags);
  }

  async cancelOrder(id: string, reason: string, cancelledBy: string): Promise<Order> {
    const order = await this.getOrderById(id);
    
    // Check if order can be cancelled
    if (!this.canCancelOrder(order)) {
      throw new ApiError(400, "Order cannot be cancelled in its current state");
    }
    
    return this.orderRepository.update(id, {
      status: OrderStatus.CANCELLED,
      cancelledAt: new Date(),
      cancelledBy,
      cancellationReason: reason
    });
  }

  async requestRefund(id: string, reason: string): Promise<Order> {
    const order = await this.getOrderById(id);
    
    // Check if refund can be requested
    if (!order.cancelledAt) {
      throw new ApiError(400, "Order must be cancelled before requesting refund");
    }
    
    if (order.refundRequested) {
      throw new ApiError(400, "Refund already requested for this order");
    }
    
    return this.orderRepository.update(id, {
      refundRequested: true
    });
  }

  // ========== ADMIN OPERATIONS ==========
  
  async addAdminNote(orderId: string, note: string, adminId: string, isInternal = true, category?: string): Promise<any> {
    return this.orderRepository.addAdminNote(orderId, note, adminId, isInternal, category);
  }

  async getAdminNotes(orderId: string): Promise<any[]> {
    return this.orderRepository.getAdminNotes(orderId);
  }

  // ========== STATISTICS ==========
  
  // async getOrderStats(filters?: Partial<OrderFilters>): Promise<OrderStats> {
  //   return this.orderRepository.getOrderStats(filters);
  // }

  async getStatusCounts(): Promise<Record<OrderStatus, number>> {
    return this.orderRepository.getStatusCounts();
  }

  async getRevenueStats(startDate?: Date, endDate?: Date): Promise<RevenueStats> {
    return this.orderRepository.getRevenueStats(startDate, endDate);
  }

  // ========== VALIDATION HELPERS ==========
  


private isOrderLocked(order: Order): boolean {
    // Explicitly type the array to include all OrderStatus values
    const lockedStatuses: OrderStatus[] = [
      OrderStatus.CANCELLED,
      OrderStatus.REFUNDED,
      OrderStatus.DELIVERED,
      OrderStatus.SHIPPED,
      OrderStatus.PURCHASED
    ];
    
    return lockedStatuses.includes(order.status);
  }
  
  private canCancelOrder(order: Order): boolean {
    // Explicitly type the array to include all OrderStatus values
    const cancellableStatuses: OrderStatus[] = [
      OrderStatus.PENDING_QUOTE,
      OrderStatus.QUOTE_SENT,
      OrderStatus.QUOTE_ACCEPTED,
      OrderStatus.DEPOSIT_PENDING,
      OrderStatus.INSPECTION_PENDING,
      OrderStatus.AWAITING_APPROVAL
    ];
    
    return cancellableStatuses.includes(order.status);
  }
  private isValidStatusTransition(from: OrderStatus, to: OrderStatus): boolean {
    // Define valid transitions
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING_QUOTE]: [OrderStatus.QUOTE_SENT, OrderStatus.CANCELLED],
      [OrderStatus.QUOTE_SENT]: [OrderStatus.QUOTE_ACCEPTED, OrderStatus.QUOTE_REJECTED, OrderStatus.QUOTE_EXPIRED, OrderStatus.CANCELLED],
      [OrderStatus.QUOTE_ACCEPTED]: [OrderStatus.DEPOSIT_PENDING, OrderStatus.CANCELLED],
      [OrderStatus.DEPOSIT_PENDING]: [OrderStatus.DEPOSIT_PAID, OrderStatus.CANCELLED],
      [OrderStatus.HALF_DEPOSIT_PAID]: [OrderStatus.BALANCE_PAID, OrderStatus.CANCELLED],
      [OrderStatus.BALANCE_PAID]: [OrderStatus.BALANCE_PAID, OrderStatus.CANCELLED],
      [OrderStatus.AWAITING_BALANCE]: [OrderStatus.BALANCE_PAID, OrderStatus.CANCELLED],
      [OrderStatus.DEPOSIT_PAID]: [OrderStatus.INSPECTION_PENDING, OrderStatus.CANCELLED],
      [OrderStatus.INSPECTION_PENDING]: [OrderStatus.INSPECTION_COMPLETE, OrderStatus.INSPECTION_FAILED, OrderStatus.CANCELLED],
      [OrderStatus.INSPECTION_COMPLETE]: [OrderStatus.AWAITING_APPROVAL, OrderStatus.CANCELLED],
      [OrderStatus.INSPECTION_FAILED]: [OrderStatus.CANCELLED],
      [OrderStatus.AWAITING_APPROVAL]: [OrderStatus.APPROVED, OrderStatus.REJECTED, OrderStatus.CANCELLED],
      [OrderStatus.APPROVED]: [OrderStatus.PURCHASE_IN_PROGRESS, OrderStatus.CANCELLED],
      [OrderStatus.REJECTED]: [OrderStatus.CANCELLED],
      [OrderStatus.PURCHASE_IN_PROGRESS]: [OrderStatus.PURCHASED, OrderStatus.CANCELLED],
      [OrderStatus.PURCHASED]: [OrderStatus.EXPORT_PENDING],
      [OrderStatus.EXPORT_PENDING]: [OrderStatus.SHIPPED],
      [OrderStatus.SHIPPED]: [OrderStatus.IN_TRANSIT],
      [OrderStatus.IN_TRANSIT]: [OrderStatus.ARRIVED_PORT],
      [OrderStatus.ARRIVED_PORT]: [OrderStatus.CUSTOMS_CLEARANCE, OrderStatus.CUSTOMS_HOLD],
      [OrderStatus.CUSTOMS_CLEARANCE]: [OrderStatus.CLEARED],
      [OrderStatus.CUSTOMS_HOLD]: [OrderStatus.CLEARED],
      [OrderStatus.CLEARED]: [OrderStatus.DELIVERY_SCHEDULED],
      [OrderStatus.DELIVERY_SCHEDULED]: [OrderStatus.OUT_FOR_DELIVERY],
      [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
      [OrderStatus.PARTIALLY_REFUNDED]: [],
      [OrderStatus.QUOTE_REJECTED]: [],
      [OrderStatus.QUOTE_EXPIRED]: []
    };
    
    return validTransitions[from]?.includes(to) || false;
  }
}