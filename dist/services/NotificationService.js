"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const inversify_1 = require("inversify");
const types_1 = require("../config/types");
const NotificationRepository_1 = require("../repositories/NotificationRepository");
const enums_1 = require("../generated/prisma/enums");
const mailer_1 = require("../utils/mailer");
let NotificationService = class NotificationService {
    constructor(repo) {
        this.repo = repo;
    }
    // ─── Admin list + stats ───────────────────────────────────────────────────
    getAdminNotifications(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            const skip = (filters.page - 1) * filters.limit;
            const { notifications, total } = yield this.repo.findAdminNotificationsPaginated({ type: filters.type, isRead: filters.isRead }, { skip, take: filters.limit });
            return {
                notifications,
                total,
                page: filters.page,
                limit: filters.limit,
                pages: Math.ceil(total / filters.limit),
            };
        });
    }
    getAdminStats() {
        return this.repo.getAdminStats();
    }
    markAsRead(id) {
        return this.repo.markAsRead(id);
    }
    markAllAdminAsRead() {
        return this.repo.markAllAdminAsRead();
    }
    // ─── Trigger helpers (called from Order / Payment flows) ─────────────────
    notifyAdminsOrderCreated(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const admins = yield this.repo.findAdminUserIds();
            yield this.repo.createForAdmins(admins, {
                orderId: payload.orderId,
                type: enums_1.NotificationType.ORDER_CREATED,
                title: 'New Order Placed',
                message: `Order ${payload.requestNumber} placed by ${payload.customerName} — ${payload.vehicleLabel}`,
                actionUrl: `/admin/orders/${payload.orderId}`,
            });
        });
    }
    notifyAdminsPaymentReceived(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const admins = yield this.repo.findAdminUserIds();
            yield this.repo.createForAdmins(admins, {
                orderId: payload.orderId,
                type: enums_1.NotificationType.PAYMENT_RECEIVED,
                title: 'Payment Confirmed',
                message: `Payment of $${payload.amountUsd.toLocaleString()} received for Order #${payload.orderRef}`,
                actionUrl: payload.orderId ? `/admin/orders/${payload.orderId}` : undefined,
            });
        });
    }
    notifySellerPaymentComplete(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. Create In-App Notification
            yield this.repo.createForUser(payload.userId, {
                orderId: payload.orderId,
                type: enums_1.NotificationType.SYSTEM_ALERT,
                title: 'Vehicle Payment Completed',
                message: `Full payment has been completed for your vehicle ${payload.vehicleName} (Order #${payload.orderRef}).`,
                actionUrl: `/seller/orders/${payload.orderId}`,
            });
            // 2. Send email
            const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #2c3e50;">Payment Completed!</h2>
        <p>Hello,</p>
        <p>Great news! Full payment has been completed for your vehicle: <strong>${payload.vehicleName}</strong>.</p>
        <p><strong>Order Reference:</strong> ${payload.orderRef}</p>
        <p><strong>Amount:</strong> $${payload.amountUsd.toLocaleString()}</p>
        <p>Please log in to your seller dashboard to proceed with the next steps.</p>
        <br/>
        <a href="https://afrozonauto.com/seller/orders/${payload.orderId}" style="display: inline-block; padding: 10px 20px; font-weight: bold; color: #fff; background-color: #27ae60; text-decoration: none; border-radius: 5px;">View Order</a>
        <br/><br/>
        <p>Best regards,</p>
        <p>Afrozon AutoGlobal Team</p>
      </div>
    `;
            try {
                yield (0, mailer_1.sendMail)(payload.userEmail, 'Vehicle Sold - Payment Completed', emailHtml);
            }
            catch (e) {
                // safe ignore wrapper to ensure in-app notification completes
            }
        });
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.NotificationRepository)),
    __metadata("design:paramtypes", [NotificationRepository_1.NotificationRepository])
], NotificationService);
