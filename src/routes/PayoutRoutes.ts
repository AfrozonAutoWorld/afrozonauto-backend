import { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { PayoutController } from '../controllers/PayoutController';
import { authenticate } from '../middleware/authMiddleware';

class PayoutRoutes {
  private router = Router();
  private ctrl = container.get<PayoutController>(TYPES.PayoutController);

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // ── Webhook (no auth, raw body) ─────────────────────────────────────────
    this.router.post('/webhooks/transfer', this.ctrl.paystackTransferWebhook);

    // ── Wallet & balance ────────────────────────────────────────────────────
    this.router.get('/balance', authenticate, this.ctrl.getWalletBalance);

    // ── PIN management ──────────────────────────────────────────────────────
    this.router.post('/pin/setup',   authenticate, this.ctrl.setupPin);
    this.router.patch('/pin/change', authenticate, this.ctrl.changePin);

    // ── Banks ───────────────────────────────────────────────────────────────
    this.router.get('/banks',          authenticate, this.ctrl.listBanks);
    this.router.post('/banks/verify',  authenticate, this.ctrl.verifyAccount);

    // ── Bank accounts ───────────────────────────────────────────────────────
    this.router.post('/bank-accounts',                  authenticate, this.ctrl.addBankAccount);
    this.router.get('/bank-accounts',                   authenticate, this.ctrl.listBankAccounts);
    this.router.patch('/bank-accounts/:id/default',     authenticate, this.ctrl.setDefaultBankAccount);
    this.router.delete('/bank-accounts/:id',            authenticate, this.ctrl.removeBankAccount);

    // ── Withdrawals ─────────────────────────────────────────────────────────
    this.router.post('/withdraw',    authenticate, this.ctrl.initiateWithdrawal);
    this.router.get('/withdrawals',  authenticate, this.ctrl.getWithdrawalHistory);
  }

  public getRouter(): Router {
    return this.router;
  }
}

export default new PayoutRoutes().getRouter();
