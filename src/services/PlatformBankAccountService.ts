import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types';
import { PlatformBankAccountRepository } from '../repositories/PlatformBankAccountRepository';
import { PlatformBankAccountCurrency } from '../generated/prisma/client';

@injectable()
export class PlatformBankAccountService {

  constructor(
    @inject(TYPES.PlatformBankAccountRepository)
    private repo: PlatformBankAccountRepository,
  ) {}

  async create(data: {
    label: string;
    bankName: string;
    bankCode?: string;
    accountName: string;
    accountNumber: string;
    currency: PlatformBankAccountCurrency;
    country: string;
    swiftCode?: string;
    iban?: string;
    sortCode?: string;
    routingNumber?: string;
    bankAddress?: string;
    isPrimary?: boolean;
    displayOrder?: number;
    instructions?: string;
    notes?: string;
  }) {
    // If this account is being set as primary, demote existing primaries for same currency
    if (data.isPrimary) {
      await this.repo.unsetPrimaryForCurrency(data.currency);
    }

    return this.repo.create(data);
  }

  getAll() {
    return this.repo.findAll();
  }

  getAllActive() {
    return this.repo.findAllActive();
  }

  getByCurrency(currency: PlatformBankAccountCurrency) {
    return this.repo.findByCurrency(currency);
  }

  async getById(id: string) {
    const account = await this.repo.findById(id);
    if (!account) return null;
    return account;
  }

  async update(id: string, data: {
    label?: string;
    bankName?: string;
    bankCode?: string;
    accountName?: string;
    accountNumber?: string;
    currency?: PlatformBankAccountCurrency;
    country?: string;
    swiftCode?: string | null;
    iban?: string | null;
    sortCode?: string | null;
    routingNumber?: string | null;
    bankAddress?: string | null;
    isActive?: boolean;
    isPrimary?: boolean;
    displayOrder?: number;
    instructions?: string | null;
    notes?: string | null;
  }) {
    const existing = await this.repo.findById(id);
    if (!existing) return null;

    // If promoting to primary, demote others in the same currency
    if (data.isPrimary) {
      const currency = data.currency ?? existing.currency;
      await this.repo.unsetPrimaryForCurrency(currency, id);
    }

    return this.repo.update(id, data);
  }

  async setPrimary(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) return null;

    await this.repo.unsetPrimaryForCurrency(existing.currency, id);
    return this.repo.update(id, { isPrimary: true });
  }

  async toggleActive(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) return null;

    return this.repo.update(id, { isActive: !existing.isActive });
  }

  async delete(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) return null;

    return this.repo.delete(id);
  }
}
