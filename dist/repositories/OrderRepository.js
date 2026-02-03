"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderRepository = void 0;
const inversify_1 = require("inversify");
const db_1 = __importDefault(require("../db"));
const client_1 = require("../generated/prisma/client");
let OrderRepository = class OrderRepository {
    updateOrderStatus(orderId, status) {
        return db_1.default.order.update({
            where: { id: orderId },
            data: {
                status,
                statusChangedAt: new Date()
            }
        });
    }
    // ========== CREATE & UPDATE ==========
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.order.create({
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
        });
    }
    update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.order.update({
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
        });
    }
    updateStatus(id, status, adminId) {
        return __awaiter(this, void 0, void 0, function* () {
            const order = yield db_1.default.order.findUnique({ where: { id } });
            return db_1.default.order.update({
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
        });
    }
    bulkUpdateStatus(ids, status, adminId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db_1.default.order.updateMany({
                where: { id: { in: ids } },
                data: {
                    status,
                    statusChangedAt: new Date(),
                    statusChangedBy: adminId
                }
            });
            return { count: result.count };
        });
    }
    // ========== READ OPERATIONS ==========
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.order.findUnique({
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
        });
    }
    findByRequestNumber(requestNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.order.findUnique({
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
        });
    }
    findByUserId(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, page = 1, limit = 10) {
            const skip = (page - 1) * limit;
            const [orders, total] = yield Promise.all([
                db_1.default.order.findMany({
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
                db_1.default.order.count({ where: { userId } })
            ]);
            const totalPages = Math.ceil(total / limit);
            return {
                orders,
                total,
                page,
                limit,
                totalPages
            };
        });
    }
    findByVehicleId(vehicleId) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.order.findMany({
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
    getStatusCounts() {
        return __awaiter(this, void 0, void 0, function* () {
            const counts = yield db_1.default.order.groupBy({
                by: ['status'],
                _count: true
            });
            const result = {};
            counts.forEach(item => {
                result[item.status] = item._count;
            });
            // Ensure all statuses are present
            Object.values(client_1.OrderStatus).forEach(status => {
                if (!result[status]) {
                    result[status] = 0;
                }
            });
            return result;
        });
    }
    getRevenueStats(startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            const whereClause = {};
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
            const revenueByStatus = yield db_1.default.order.groupBy({
                by: ['status'],
                where: whereClause,
                _count: true,
                _sum: {
                    totalLandedCostUsd: true,
                    depositAmountUsd: true
                }
            });
            // Get revenue by country
            const revenueByCountry = yield db_1.default.order.groupBy({
                by: ['destinationCountry'],
                where: whereClause,
                _count: true,
                _sum: {
                    totalLandedCostUsd: true
                }
            });
            // Get totals
            const totals = yield db_1.default.order.aggregate({
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
            const byStatus = {};
            revenueByStatus.forEach(item => {
                byStatus[item.status] = {
                    count: item._count,
                    revenue: item._sum.totalLandedCostUsd || 0
                };
            });
            // const byCountry: Record<string, { count: number; revenue: number }> = {};
            // revenueByCountry.forEach(item => {
            //   byCountry[item?.destinationCountry] = {
            //     count: item._count,
            //     revenue: item._sum.totalLandedCostUsd || 0
            //   };
            // });
            return {
                totalRevenue,
                totalDeposits,
                totalBalance,
                totalRefunds,
                averageOrderValue: totals._count > 0 ? totalRevenue / totals._count : 0,
                byStatus,
                // byCountry
            };
        });
    }
    // ========== ADMIN OPERATIONS ==========
    addAdminNote(orderId_1, note_1, adminId_1) {
        return __awaiter(this, arguments, void 0, function* (orderId, note, adminId, isInternal = true, category) {
            return db_1.default.adminNote.create({
                data: {
                    orderId,
                    note,
                    createdById: adminId,
                    isInternal,
                    category
                }
            });
        });
    }
    getAdminNotes(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.adminNote.findMany({
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
        });
    }
    updatePriority(id, priority) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.order.update({
                where: { id },
                data: { priority }
            });
        });
    }
    assignTags(id, tags) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.order.update({
                where: { id },
                data: { tags: { set: tags } }
            });
        });
    }
    // ========== DELETE OPERATIONS ==========
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield db_1.default.order.delete({ where: { id } });
                return true;
            }
            catch (error) {
                return false;
            }
        });
    }
    softDelete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.order.update({
                where: { id },
                data: {
                    status: client_1.OrderStatus.CANCELLED,
                    cancelledAt: new Date(),
                    cancellationReason: 'Deleted by admin'
                }
            });
        });
    }
};
exports.OrderRepository = OrderRepository;
exports.OrderRepository = OrderRepository = __decorate([
    (0, inversify_1.injectable)()
], OrderRepository);
