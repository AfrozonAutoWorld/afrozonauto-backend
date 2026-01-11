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
  

  findByReference(reference: string) {
    return prisma.payment.findFirst({
      where: { transactionRef: reference },
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
