import { injectable } from 'inversify';
import prisma from '../db';

@injectable()
export class PaymentRepository {

  createPayment(data: any) {
    return prisma.payment.create({ data });
  }

  updatePaymentByRef(reference: string, data: any) {
    return prisma.payment.update({
      where: { transactionRef: reference },
      data
    });
  }
  updatePayment(id: string, data: any) {
    return prisma.payment.update({
      where: { id },
      data
    });
  }
  

  findByReference(reference: string) {
    return prisma.payment.findFirst({
      where: { transactionRef: reference },
      include: { order: true }
    });
  }
  findById(id: string) {
    return prisma.payment.findFirst({
      where: { id },
      include: { order: true }
    });
  }
  findAll() {
    return prisma.payment.findMany({
      include: { order: true }
    });
  }
  findAllUserPayments(userId: string) {
    return prisma.payment.findMany({
      where: { userId },
      include: { order: true }
    });
  }

  
  updateByReference(transactionRef: string, data: any) {
    return prisma.payment.update({
      where: { transactionRef },
      data
    });
  }
  
//   markExpiredAsAbandoned(now: Date) {
//     return prisma.payment.updateMany({
//       where: {
//         status: 'PENDING',
//         expiresAt: { lt: now }
//       },
//       data: {
//         status: 'ABANDONED'
//       }
//     });
//   }
  
}
