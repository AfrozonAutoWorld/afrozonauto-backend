import { injectable } from "inversify";
import prisma from '../db';
import { 
  Order, 
  OrderStatus, 
  ShippingMethod, 
  OrderPriority,
  Prisma 
} from '../generated/prisma/client';

export interface IOrderRepository {
  // Create & Update
  create(data: Prisma.OrderCreateInput): Promise<Order>;
  update(id: string, data: Prisma.OrderUpdateInput): Promise<Order>;
  updateStatus(id: string, status: OrderStatus, adminId?: string): Promise<Order>;
  bulkUpdateStatus(ids: string[], status: OrderStatus, adminId?: string): Promise<{ count: number }>;
  
  // Read Operations
  findById(id: string): Promise<Order | null>;
  findByRequestNumber(requestNumber: string): Promise<Order | null>;
  findByUserId(userId: string, page?: number, limit?: number): Promise<{
    orders: Order[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  findByVehicleId(vehicleId: string): Promise<Order[]>;
  
  // Advanced Queries
  // findAllWithFilters(filters: OrderFilters, page?: number, limit?: number): Promise<{
  //   orders: Order[];
  //   total: number;
  //   page: number;
  //   limit: number;
  //   totalPages: number;
  //   stats: OrderStats;
  // }>;
  
  // // Statistics & Analytics
  // getOrderStats(filters?: Partial<OrderFilters>): Promise<OrderStats>;
  getStatusCounts(): Promise<Record<OrderStatus, number>>;
  getRevenueStats(startDate?: Date, endDate?: Date): Promise<RevenueStats>;
  
  // Admin Operations
  addAdminNote(orderId: string, note: string, adminId: string, isInternal?: boolean, category?: string): Promise<any>;
  getAdminNotes(orderId: string): Promise<any[]>;
  updatePriority(id: string, priority: OrderPriority): Promise<Order>;
  assignTags(id: string, tags: string[]): Promise<Order>;
  
  // Delete
  delete(id: string): Promise<boolean>;
  softDelete(id: string): Promise<Order>;
  updateOrderStatus(orderId: string, status: OrderStatus) : Promise<Order[]> 
}

export interface OrderFilters {
  status?: OrderStatus | OrderStatus[];
  userId?: string;
  vehicleId?: string;
  destinationCountry?: string;
  destinationState?: string;
  shippingMethod?: ShippingMethod;
  priority?: OrderPriority;
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
  search?: string;
  isCancelled?: boolean;
  isRefunded?: boolean;
}

export interface OrderStats {
  total: number;
  totalValue: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  averageOrderValue: number;
  byCountry: Record<string, number>;
  byStatus: Record<OrderStatus, number>;
  byMonth: Array<{ month: string; count: number; value: number }>;
}

export interface RevenueStats {
  totalRevenue: number;
  totalDeposits: number;
  totalBalance: number;
  totalRefunds: number;
  averageOrderValue: number;
  byStatus: Record<OrderStatus, { count: number; revenue: number }>;
  byCountry: Record<string, { count: number; revenue: number }>;
}


@injectable()
export class OrderRepository {

  updateOrderStatus(orderId: string, status: any) {
    return prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        statusChangedAt: new Date()
      }
    });
  }
  

  // ========== CREATE & UPDATE ==========
  
  async create(data: Prisma.OrderCreateInput): Promise<Order> {
    return prisma.order.create({ 
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true
          }
        },
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            priceUsd: true,
            thumbnail: true
          }
        }
      }
    });
  }

  async update(id: string, data: Prisma.OrderUpdateInput): Promise<Order> {
    return prisma.order.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true
          }
        },
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            priceUsd: true,
            thumbnail: true
          }
        },
        payments: true,
        inspection: true,
        shipment: true
      }
    });
  }

  async updateStatus(id: string, status: OrderStatus, adminId?: string): Promise<Order> {
    const order = await prisma.order.findUnique({ where: { id } });
    
    return prisma.order.update({
      where: { id },
      data: {
        status,
        previousStatus: order ? [...order.previousStatus, order.status] : [],
        statusChangedAt: new Date(),
        statusChangedBy: adminId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true
          }
        }
      }
    });
  }

  async bulkUpdateStatus(ids: string[], status: OrderStatus, adminId?: string): Promise<{ count: number }> {
    const result = await prisma.order.updateMany({
      where: { id: { in: ids } },
      data: {
        status,
        statusChangedAt: new Date(),
        statusChangedBy: adminId
      }
    });
    
    return { count: result.count };
  }

  // ========== READ OPERATIONS ==========
  
  async findById(id: string): Promise<Order | null> {
    return prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true
          }
        },
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            priceUsd: true,
            thumbnail: true,
            vin: true,
            mileage: true
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        },
        inspection: true,
        shipment: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        adminNotes: {
          where: { isInternal: false },
          orderBy: { createdAt: 'desc' }
        },
        activityLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });
  }

  async findByRequestNumber(requestNumber: string): Promise<Order | null> {
    return prisma.order.findUnique({
      where: { requestNumber },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true
          }
        },
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            priceUsd: true,
            thumbnail: true
          }
        }
      }
    });
  }

  async findByUserId(userId: string, page = 1, limit = 10): Promise<{
    orders: Order[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          vehicle: {
            select: {
              id: true,
              make: true,
              model: true,
              year: true,
              thumbnail: true
            }
          },
          payments: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        }
      }),
      prisma.order.count({ where: { userId } })
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      orders,
      total,
      page,
      limit,
      totalPages
    };
  }

  async findByVehicleId(vehicleId: string): Promise<Order[]> {
    return prisma.order.findMany({
      where: { vehicleId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true
          }
        }
      }
    });
  }

  // ========== ADVANCED QUERIES ==========
  
  // async findAllWithFilters(filters: OrderFilters, page = 1, limit = 20): Promise<{
  //   orders: Order[];
  //   total: number;
  //   page: number;
  //   limit: number;
  //   totalPages: number;
  //   stats: OrderStats;
  // }> {
  //   const skip = (page - 1) * limit;
    
  //   // Build where clause
  //   const whereClause: any = {};
    
  //   if (filters.status) {
  //     if (Array.isArray(filters.status)) {
  //       whereClause.status = { in: filters.status };
  //     } else {
  //       whereClause.status = filters.status;
  //     }
  //   }
    
  //   if (filters.userId) {
  //     whereClause.userId = filters.userId;
  //   }
    
  //   if (filters.vehicleId) {
  //     whereClause.vehicleId = filters.vehicleId;
  //   }
    
  //   if (filters.destinationCountry) {
  //     whereClause.destinationCountry = filters.destinationCountry;
  //   }
    
  //   if (filters.destinationState) {
  //     whereClause.destinationState = filters.destinationState;
  //   }
    
  //   if (filters.shippingMethod) {
  //     whereClause.shippingMethod = filters.shippingMethod;
  //   }
    
  //   if (filters.priority) {
  //     whereClause.priority = filters.priority;
  //   }
    
  //   if (filters.tags && filters.tags.length > 0) {
  //     whereClause.tags = { hasEvery: filters.tags };
  //   }
    
  //   if (filters.startDate || filters.endDate) {
  //     whereClause.createdAt = {};
  //     if (filters.startDate) {
  //       whereClause.createdAt.gte = filters.startDate;
  //     }
  //     if (filters.endDate) {
  //       whereClause.createdAt.lte = filters.endDate;
  //     }
  //   }
    
  //   if (filters.search) {
  //     whereClause.OR = [
  //       { requestNumber: { contains: filters.search, mode: 'insensitive' } },
  //       { customerNotes: { contains: filters.search, mode: 'insensitive' } },
  //       { specialRequests: { contains: filters.search, mode: 'insensitive' } }
  //     ];
  //   }
    
  //   if (filters.isCancelled !== undefined) {
  //     whereClause.cancelledAt = filters.isCancelled ? { not: null } : null;
  //   }
    
  //   if (filters.isRefunded !== undefined) {
  //     whereClause.refundRequested = filters.isRefunded;
  //   }
    
  //   // Execute queries
  //   const [orders, total, stats] = await Promise.all([
  //     prisma.order.findMany({
  //       where: whereClause,
  //       orderBy: { createdAt: 'desc' },
  //       skip,
  //       take: limit,
  //       include: {
  //         user: {
  //           select: {
  //             id: true,
  //             email: true,
  //             fullName: true
  //           }
  //         },
  //         vehicle: {
  //           select: {
  //             id: true,
  //             make: true,
  //             model: true,
  //             year: true,
  //             thumbnail: true
  //           }
  //         },
  //         payments: {
  //           take: 1,
  //           orderBy: { createdAt: 'desc' }
  //         }
  //       }
  //     }),
  //     prisma.order.count({ where: whereClause }),
  //     this.getOrderStats(filters)
  //   ]);
    
  //   const totalPages = Math.ceil(total / limit);
    
  //   return {
  //     orders,
  //     total,
  //     page,
  //     limit,
  //     totalPages,
  //     stats
  //   };
  // }

  // async getOrderStats(filters?: Partial<OrderFilters>): Promise<OrderStats> {
  //   const whereClause: any = {};
    
  //   if (filters) {
  //     if (filters.startDate || filters.endDate) {
  //       whereClause.createdAt = {};
  //       if (filters.startDate) {
  //         whereClause.createdAt.gte = filters.startDate;
  //       }
  //       if (filters.endDate) {
  //         whereClause.createdAt.lte = filters.endDate;
  //       }
  //     }
      
  //     if (filters.destinationCountry) {
  //       whereClause.destinationCountry = filters.destinationCountry;
  //     }
      
  //     if (filters.status) {
  //       whereClause.status = filters.status;
  //     }
  //   }
    
  //   // Get counts by status
  //   const statusCounts = await prisma.order.groupBy({
  //     by: ['status'],
  //     where: whereClause,
  //     _count: true,
  //     _sum: {
  //       totalLandedCostUsd: true
  //     }
  //   });
    
  //   // Get counts by country
  //   const countryCounts = await prisma.order.groupBy({
  //     by: ['destinationCountry'],
  //     where: whereClause,
  //     _count: true
  //   });
    
  //   // Get monthly stats
  //   const monthlyStats = await prisma.$queryRaw`
  //     SELECT 
  //       TO_CHAR("createdAt", 'YYYY-MM') as month,
  //       COUNT(*) as count,
  //       COALESCE(SUM("totalLandedCostUsd"), 0) as value
  //     FROM "orders"
  //     WHERE ${whereClause.createdAt ? `"createdAt" >= ${filters?.startDate} AND "createdAt" <= ${filters?.endDate}` : '1=1'}
  //     GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
  //     ORDER BY month DESC
  //     LIMIT 12
  //   `;
    
  //   // Calculate aggregates
  //   const totalCount = await prisma.order.count({ where: whereClause });
  //   const totalValue = await prisma.order.aggregate({
  //     where: whereClause,
  //     _sum: { totalLandedCostUsd: true }
  //   });
    
  //   // Categorize statuses
  //   const pendingStatuses: OrderStatus[] = [
  //     OrderStatus.PENDING_QUOTE,
  //     OrderStatus.QUOTE_SENT,
  //     OrderStatus.DEPOSIT_PENDING
  //   ];
    
  //   const inProgressStatuses: OrderStatus[] = [
  //     OrderStatus.DEPOSIT_PAID,
  //     OrderStatus.INSPECTION_PENDING,
  //     OrderStatus.INSPECTION_COMPLETE,
  //     OrderStatus.APPROVED,
  //     OrderStatus.PURCHASE_IN_PROGRESS,
  //     OrderStatus.PURCHASED,
  //     OrderStatus.EXPORT_PENDING,
  //     OrderStatus.SHIPPED,
  //     OrderStatus.IN_TRANSIT,
  //     OrderStatus.ARRIVED_PORT,
  //     OrderStatus.CUSTOMS_CLEARANCE,
  //     OrderStatus.CLEARED,
  //     OrderStatus.DELIVERY_SCHEDULED,
  //     OrderStatus.OUT_FOR_DELIVERY
  //   ];
    
  //   const completedStatuses: OrderStatus[] = [OrderStatus.DELIVERED];
  //   const cancelledStatuses: OrderStatus[] = [OrderStatus.CANCELLED, OrderStatus.REFUNDED];
    
  //   const pendingCount = await prisma.order.count({
  //     where: { ...whereClause, status: { in: pendingStatuses } }
  //   });
    
  //   const inProgressCount = await prisma.order.count({
  //     where: { ...whereClause, status: { in: inProgressStatuses } }
  //   });
    
  //   const completedCount = await prisma.order.count({
  //     where: { ...whereClause, status: { in: completedStatuses } }
  //   });
    
  //   const cancelledCount = await prisma.order.count({
  //     where: { ...whereClause, status: { in: cancelledStatuses } }
  //   });
    
  //   // Build status map
  //   const byStatus = {} as Record<OrderStatus, number>;
  //   statusCounts.forEach(item => {
  //     byStatus[item.status] = item._count;
  //   });
    
  //   // Build country map
  //   const byCountry = {} as Record<string, number>;
  //   countryCounts.forEach(item => {
  //     byCountry[item.destinationCountry] = item._count;
  //   });
    
  //   return {
  //     total: totalCount,
  //     totalValue: totalValue._sum.totalLandedCostUsd || 0,
  //     pending: pendingCount,
  //     inProgress: inProgressCount,
  //     completed: completedCount,
  //     cancelled: cancelledCount,
  //     averageOrderValue: totalCount > 0 ? (totalValue._sum.totalLandedCostUsd || 0) / totalCount : 0,
  //     byCountry,
  //     byStatus,
  //     byMonth: monthlyStats as Array<{ month: string; count: number; value: number }>
  //   };
  // }

  async getStatusCounts(): Promise<Record<OrderStatus, number>> {
    const counts = await prisma.order.groupBy({
      by: ['status'],
      _count: true
    });
    
    const result = {} as Record<OrderStatus, number>;
    counts.forEach(item => {
      result[item.status] = item._count;
    });
    
    // Ensure all statuses are present
    Object.values(OrderStatus).forEach(status => {
      if (!result[status]) {
        result[status] = 0;
      }
    });
    
    return result;
  }

  async getRevenueStats(startDate?: Date, endDate?: Date): Promise<RevenueStats> {
    const whereClause: any = {};
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = startDate;
      }
      if (endDate) {
        whereClause.createdAt.lte = endDate;
      }
    }
    
    // Get revenue by status
    const revenueByStatus = await prisma.order.groupBy({
      by: ['status'],
      where: whereClause,
      _count: true,
      _sum: {
        totalLandedCostUsd: true,
        depositAmountUsd: true
      }
    });
    
    // Get revenue by country
    const revenueByCountry = await prisma.order.groupBy({
      by: ['destinationCountry'],
      where: whereClause,
      _count: true,
      _sum: {
        totalLandedCostUsd: true
      }
    });
    
    // Get totals
    const totals = await prisma.order.aggregate({
      where: whereClause,
      _sum: {
        totalLandedCostUsd: true,
        depositAmountUsd: true,
        refundAmount: true
      },
      _count: true
    });
    
    // Calculate balance
    const totalRevenue = totals._sum.totalLandedCostUsd || 0;
    const totalDeposits = totals._sum.depositAmountUsd || 0;
    const totalRefunds = totals._sum.refundAmount || 0;
    const totalBalance = totalRevenue - totalDeposits;
    
    // Build result
    const byStatus: Record<OrderStatus, { count: number; revenue: number }> = {} as any;
    revenueByStatus.forEach(item => {
      byStatus[item.status] = {
        count: item._count,
        revenue: item._sum.totalLandedCostUsd || 0
      };
    });
    
    const byCountry: Record<string, { count: number; revenue: number }> = {};
    revenueByCountry.forEach(item => {
      byCountry[item.destinationCountry] = {
        count: item._count,
        revenue: item._sum.totalLandedCostUsd || 0
      };
    });
    
    return {
      totalRevenue,
      totalDeposits,
      totalBalance,
      totalRefunds,
      averageOrderValue: totals._count > 0 ? totalRevenue / totals._count : 0,
      byStatus,
      byCountry
    };
  }

  // ========== ADMIN OPERATIONS ==========
  
  async addAdminNote(orderId: string, note: string, adminId: string, isInternal = true, category?: string): Promise<any> {
    return prisma.adminNote.create({
      data: {
        orderId,
        note,
        createdById: adminId,
        isInternal,
        category
      }
    });
  }

  async getAdminNotes(orderId: string): Promise<any[]> {
    return prisma.adminNote.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            fullName: true
          }
        }
      }
    });
  }

  async updatePriority(id: string, priority: OrderPriority): Promise<Order> {
    return prisma.order.update({
      where: { id },
      data: { priority }
    });
  }

  async assignTags(id: string, tags: string[]): Promise<Order> {
    return prisma.order.update({
      where: { id },
      data: { tags: { set: tags } }
    });
  }

  // ========== DELETE OPERATIONS ==========
  
  async delete(id: string): Promise<boolean> {
    try {
      await prisma.order.delete({ where: { id } });
      return true;
    } catch (error) {
      return false;
    }
  }

  async softDelete(id: string): Promise<Order> {
    return prisma.order.update({
      where: { id },
      data: { 
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: 'Deleted by admin'
      }
    });
  }
}
