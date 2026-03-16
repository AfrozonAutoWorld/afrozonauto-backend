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
exports.AdminDashboardRepository = void 0;
const inversify_1 = require("inversify");
const db_1 = __importDefault(require("../db"));
const enums_1 = require("../generated/prisma/enums");
const PENDING_ORDER_STATUSES = [
    enums_1.OrderStatus.PENDING_QUOTE,
    enums_1.OrderStatus.QUOTE_SENT,
    enums_1.OrderStatus.QUOTE_ACCEPTED,
    enums_1.OrderStatus.DEPOSIT_PENDING,
];
let AdminDashboardRepository = class AdminDashboardRepository {
    // ─── Stats ────────────────────────────────────────────────────────────────
    getDashboardStats() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const now = new Date();
            const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const [totalUsers, totalCars, apiCars, totalOrders, pendingOrdersCount, revenueThisMonth, revenueLastMonth,] = yield Promise.all([
                // Total non-deleted users
                db_1.default.user.count({ where: { isDeleted: false } }),
                // Total vehicles
                db_1.default.vehicle.count(),
                // API-sourced vehicles (have an apiListingId)
                db_1.default.vehicle.count({ where: { apiListingId: { not: null } } }),
                // Total orders
                db_1.default.order.count(),
                // Pending orders
                db_1.default.order.count({ where: { status: { in: PENDING_ORDER_STATUSES } } }),
                // Revenue this month (completed payments)
                db_1.default.payment.aggregate({
                    _sum: { amountUsd: true },
                    where: {
                        status: enums_1.PaymentStatus.COMPLETED,
                        completedAt: { gte: startOfThisMonth },
                    },
                }),
                // Revenue last month
                db_1.default.payment.aggregate({
                    _sum: { amountUsd: true },
                    where: {
                        status: enums_1.PaymentStatus.COMPLETED,
                        completedAt: { gte: startOfLastMonth, lt: startOfThisMonth },
                    },
                }),
            ]);
            const thisMonthRevenue = (_a = revenueThisMonth._sum.amountUsd) !== null && _a !== void 0 ? _a : 0;
            const lastMonthRevenue = (_b = revenueLastMonth._sum.amountUsd) !== null && _b !== void 0 ? _b : 0;
            const revenueChangePercent = lastMonthRevenue === 0
                ? null
                : Number((((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1));
            // Total revenue (all time)
            const allTimeRevenue = yield db_1.default.payment.aggregate({
                _sum: { amountUsd: true },
                where: { status: enums_1.PaymentStatus.COMPLETED },
            });
            return {
                totalUsers,
                totalCars,
                carBreakdown: { api: apiCars, manual: totalCars - apiCars },
                totalOrders,
                pendingOrdersCount,
                totalRevenue: (_c = allTimeRevenue._sum.amountUsd) !== null && _c !== void 0 ? _c : 0,
                revenueThisMonth: thisMonthRevenue,
                revenueLastMonth: lastMonthRevenue,
                revenueChangePercent,
            };
        });
    }
    // ─── Pending Orders ───────────────────────────────────────────────────────
    getPendingOrders(page, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            const skip = (page - 1) * limit;
            const [orders, total] = yield Promise.all([
                db_1.default.order.findMany({
                    where: { status: { in: PENDING_ORDER_STATUSES } },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                fullName: true,
                                profile: { select: { firstName: true, lastName: true } },
                            },
                        },
                        vehicle: {
                            select: {
                                id: true,
                                make: true,
                                model: true,
                                year: true,
                                thumbnail: true,
                                priceUsd: true,
                            },
                        },
                    },
                }),
                db_1.default.order.count({ where: { status: { in: PENDING_ORDER_STATUSES } } }),
            ]);
            return { orders, total, page, limit, pages: Math.ceil(total / limit) };
        });
    }
    // ─── Recent Activity ──────────────────────────────────────────────────────
    getRecentActivity(limit) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.activityLog.findMany({
                orderBy: { createdAt: 'desc' },
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            fullName: true,
                            profile: { select: { firstName: true, lastName: true } },
                        },
                    },
                },
            });
        });
    }
};
exports.AdminDashboardRepository = AdminDashboardRepository;
exports.AdminDashboardRepository = AdminDashboardRepository = __decorate([
    (0, inversify_1.injectable)()
], AdminDashboardRepository);
