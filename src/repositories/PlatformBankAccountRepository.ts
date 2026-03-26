import { injectable } from 'inversify';
import prisma from '../db';
import { PlatformBankAccountCurrency } from '../generated/prisma/client';

@injectable()
export class PlatformBankAccountRepository {

  create(data: any) {
    return prisma.platformBankAccount.create({ data });
  }

  findAll() {
    return prisma.platformBankAccount.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  findAllActive() {
    return prisma.platformBankAccount.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  findByCurrency(currency: PlatformBankAccountCurrency) {
    return prisma.platformBankAccount.findMany({
      where: { currency, isActive: true },
      orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }],
    });
  }

  findById(id: string) {
    return prisma.platformBankAccount.findUnique({ where: { id } });
  }

  update(id: string, data: any) {
    return prisma.platformBankAccount.update({ where: { id }, data });
  }

  delete(id: string) {
    return prisma.platformBankAccount.delete({ where: { id } });
  }

  /** Unset isPrimary on all accounts with the same currency (used before setting a new primary) */
  unsetPrimaryForCurrency(currency: PlatformBankAccountCurrency, excludeId?: string) {
    return prisma.platformBankAccount.updateMany({
      where: {
        currency,
        isPrimary: true,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      data: { isPrimary: false },
    });
  }
}
