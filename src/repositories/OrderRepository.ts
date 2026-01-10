import { injectable } from 'inversify';
import prisma from '../db';

@injectable()
export class OrderRepository {

  updateOrderStatus(orderId: string, status: any) {
    return prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        statusChangedAt: new Date()
      }
    });
  }
}
