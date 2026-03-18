"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inversify_config_1 = require("../config/inversify.config");
const types_1 = require("../config/types");
const authMiddleware_1 = require("../middleware/authMiddleware");
class PayoutRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.ctrl = inversify_config_1.container.get(types_1.TYPES.PayoutController);
        this.initializeRoutes();
    }
    initializeRoutes() {
        // ── Webhook (no auth, raw body) ─────────────────────────────────────────
        this.router.post('/webhooks/transfer', this.ctrl.paystackTransferWebhook);
        // ── Wallet & balance ────────────────────────────────────────────────────
        this.router.get('/balance', authMiddleware_1.authenticate, this.ctrl.getWalletBalance);
        // ── PIN management ──────────────────────────────────────────────────────
        this.router.post('/pin/setup', authMiddleware_1.authenticate, this.ctrl.setupPin);
        this.router.patch('/pin/change', authMiddleware_1.authenticate, this.ctrl.changePin);
        // ── Banks ───────────────────────────────────────────────────────────────
        this.router.get('/banks', authMiddleware_1.authenticate, this.ctrl.listBanks);
        this.router.post('/banks/verify', authMiddleware_1.authenticate, this.ctrl.verifyAccount);
        // ── Bank accounts ───────────────────────────────────────────────────────
        this.router.post('/bank-accounts', authMiddleware_1.authenticate, this.ctrl.addBankAccount);
        this.router.get('/bank-accounts', authMiddleware_1.authenticate, this.ctrl.listBankAccounts);
        this.router.patch('/bank-accounts/:id/default', authMiddleware_1.authenticate, this.ctrl.setDefaultBankAccount);
        this.router.delete('/bank-accounts/:id', authMiddleware_1.authenticate, this.ctrl.removeBankAccount);
        // ── Withdrawals ─────────────────────────────────────────────────────────
        this.router.post('/withdraw', authMiddleware_1.authenticate, this.ctrl.initiateWithdrawal);
        this.router.get('/withdrawals', authMiddleware_1.authenticate, this.ctrl.getWithdrawalHistory);
    }
    getRouter() {
        return this.router;
    }
}
exports.default = new PayoutRoutes().getRouter();
