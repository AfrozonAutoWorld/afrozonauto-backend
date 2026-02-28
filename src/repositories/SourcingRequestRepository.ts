import { injectable } from 'inversify';
import prisma from '../db';
import { SourcingRequest, SourcingRequestStatus, Prisma } from '../generated/prisma/client';
import type { CreateSourcingRequestDto } from '../validation/interfaces/ISourcingRequest';

export interface SourcingRequestFilters {
  status?: SourcingRequestStatus;
  fromDate?: Date;
  toDate?: Date;
}

@injectable()
export class SourcingRequestRepository {
  async create(data: Prisma.SourcingRequestCreateInput): Promise<SourcingRequest> {
    return prisma.sourcingRequest.create({ data });
  }

  async findById(id: string): Promise<SourcingRequest | null> {
    return prisma.sourcingRequest.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, fullName: true } } },
    });
  }

  async findByRequestNumber(requestNumber: string): Promise<SourcingRequest | null> {
    return prisma.sourcingRequest.findUnique({
      where: { requestNumber },
    });
  }

  async list(filters?: SourcingRequestFilters, page = 1, limit = 50): Promise<{
    items: SourcingRequest[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const where: Prisma.SourcingRequestWhereInput = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.fromDate || filters?.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = filters.fromDate;
      if (filters.toDate) where.createdAt.lte = filters.toDate;
    }

    const [items, total] = await Promise.all([
      prisma.sourcingRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sourcingRequest.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
