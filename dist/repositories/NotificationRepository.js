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
exports.NotificationRepository = void 0;
const inversify_1 = require("inversify");
const db_1 = __importDefault(require("../db"));
const enums_1 = require("../generated/prisma/enums");
let NotificationRepository = class NotificationRepository {
    // ─── Admin user lookup (used internally) ─────────────────────────────────
    findAdminUserIds() {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.user.findMany({
                where: {
                    role: { in: [enums_1.UserRole.OPERATIONS_ADMIN, enums_1.UserRole.SUPER_ADMIN] },
                    isDeleted: false,
                    isActive: true,
                },
                select: { id: true, email: true },
            });
        });
    }
    // ─── Create notifications for all admins ─────────────────────────────────
    createForAdmins(adminUsers, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (adminUsers.length === 0)
                return;
            yield db_1.default.notification.createMany({
                data: adminUsers.map((admin) => ({
                    userId: admin.id,
                    orderId: data.orderId,
                    type: data.type,
                    title: data.title,
                    message: data.message,
                    actionUrl: data.actionUrl,
                    // Store recipient email in actionLabel field for display
                    actionLabel: admin.email,
                    isRead: false,
                })),
            });
        });
    }
    // ─── Paginated admin notifications (with recipient email) ─────────────────
    findAdminNotificationsPaginated(filters, pagination) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get all admin IDs
            const admins = yield this.findAdminUserIds();
            const adminIds = admins.map((a) => a.id);
            const adminEmailMap = new Map(admins.map((a) => [a.id, a.email]));
            const where = { userId: { in: adminIds } };
            if (filters.type)
                where.type = filters.type;
            if (filters.isRead !== undefined)
                where.isRead = filters.isRead;
            const [notifications, total] = yield Promise.all([
                db_1.default.notification.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip: pagination.skip,
                    take: pagination.take,
                }),
                db_1.default.notification.count({ where }),
            ]);
            // Attach recipient email (stored in actionLabel) to each notification
            const enriched = notifications.map((n) => {
                var _a, _b;
                return (Object.assign(Object.assign({}, n), { recipientEmail: (_b = (_a = n.actionLabel) !== null && _a !== void 0 ? _a : adminEmailMap.get(n.userId)) !== null && _b !== void 0 ? _b : n.userId }));
            });
            return { notifications: enriched, total };
        });
    }
    // ─── Stats ────────────────────────────────────────────────────────────────
    getAdminStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const admins = yield this.findAdminUserIds();
            const adminIds = admins.map((a) => a.id);
            const where = { userId: { in: adminIds } };
            const [totalSent, delivered, pending, orderAlerts] = yield Promise.all([
                db_1.default.notification.count({ where }),
                db_1.default.notification.count({ where: Object.assign(Object.assign({}, where), { isRead: true }) }),
                db_1.default.notification.count({ where: Object.assign(Object.assign({}, where), { isRead: false }) }),
                db_1.default.notification.count({
                    where: Object.assign(Object.assign({}, where), { type: enums_1.NotificationType.ORDER_CREATED }),
                }),
            ]);
            return { totalSent, delivered, pending, orderAlerts };
        });
    }
    // ─── Mark as read ─────────────────────────────────────────────────────────
    markAsRead(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const exists = yield db_1.default.notification.findUnique({ where: { id }, select: { id: true } });
            if (!exists)
                return null;
            return db_1.default.notification.update({
                where: { id },
                data: { isRead: true, readAt: new Date() },
            });
        });
    }
    markAllAdminAsRead() {
        return __awaiter(this, void 0, void 0, function* () {
            const admins = yield this.findAdminUserIds();
            const adminIds = admins.map((a) => a.id);
            return db_1.default.notification.updateMany({
                where: { userId: { in: adminIds }, isRead: false },
                data: { isRead: true, readAt: new Date() },
            });
        });
    }
};
exports.NotificationRepository = NotificationRepository;
exports.NotificationRepository = NotificationRepository = __decorate([
    (0, inversify_1.injectable)()
], NotificationRepository);
