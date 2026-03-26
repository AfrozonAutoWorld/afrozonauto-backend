import { inject, injectable } from 'inversify';
import { Response } from 'express';
import { TYPES } from '../config/types';
import { asyncHandler } from '../utils/asyncHandler';
import { PlatformBankAccountService } from '../services/PlatformBankAccountService';
import { AuthenticatedRequest } from '../types/customRequest';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { PlatformBankAccountCurrency } from '../generated/prisma/client';

@injectable()
export class PlatformBankAccountController {

  constructor(
    @inject(TYPES.PlatformBankAccountService)
    private service: PlatformBankAccountService,
  ) {}

  // ─── Public ──────────────────────────────────────────────────────────────

  /** GET /api/platform-bank-accounts — list all active accounts (shown to buyers) */
  listActive = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const accounts = await this.service.getAllActive();
    return res.status(200).json(ApiResponse.success(accounts));
  });

  /** GET /api/platform-bank-accounts/by-currency/:currency */
  listByCurrency = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { currency } = req.params;

    if (!Object.values(PlatformBankAccountCurrency).includes(currency as PlatformBankAccountCurrency)) {
      return res.status(400).json(
        ApiError.badRequest(`Invalid currency. Must be one of: ${Object.values(PlatformBankAccountCurrency).join(', ')}`)
      );
    }

    const accounts = await this.service.getByCurrency(currency as PlatformBankAccountCurrency);
    return res.status(200).json(ApiResponse.success(accounts));
  });

  // ─── Admin ────────────────────────────────────────────────────────────────

  /** GET /api/platform-bank-accounts/admin/all — all accounts including inactive */
  listAll = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const accounts = await this.service.getAll();
    return res.status(200).json(ApiResponse.success(accounts));
  });

  /** POST /api/platform-bank-accounts */
  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const account = await this.service.create(req.body);
    return res.status(201).json(ApiResponse.created(account, 'Bank account created'));
  });

  /** PATCH /api/platform-bank-accounts/:id */
  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const account = await this.service.update(id, req.body);

    if (!account) {
      return res.status(404).json(ApiError.notFound('Bank account not found'));
    }

    return res.status(200).json(ApiResponse.success(account, 'Bank account updated'));
  });

  /** PATCH /api/platform-bank-accounts/:id/set-primary */
  setPrimary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const account = await this.service.setPrimary(id);

    if (!account) {
      return res.status(404).json(ApiError.notFound('Bank account not found'));
    }

    return res.status(200).json(ApiResponse.success(account, 'Set as primary'));
  });

  /** PATCH /api/platform-bank-accounts/:id/toggle */
  toggleActive = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const account = await this.service.toggleActive(id);

    if (!account) {
      return res.status(404).json(ApiError.notFound('Bank account not found'));
    }

    return res.status(200).json(
      ApiResponse.success(account, `Account ${account.isActive ? 'activated' : 'deactivated'}`)
    );
  });

  /** DELETE /api/platform-bank-accounts/:id */
  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const account = await this.service.delete(id);

    if (!account) {
      return res.status(404).json(ApiError.notFound('Bank account not found'));
    }

    return res.status(200).json(ApiResponse.success(null, 'Bank account deleted'));
  });
}
