import { injectable } from 'inversify';
import prisma from '../db';
import { TrendingDefinition, Prisma } from '../generated/prisma/client';

@injectable()
export class TrendingDefinitionRepository {
  async findManyActive(): Promise<TrendingDefinition[]> {
    return prisma.trendingDefinition.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findMany(): Promise<TrendingDefinition[]> {
    return prisma.trendingDefinition.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findById(id: string): Promise<TrendingDefinition | null> {
    return prisma.trendingDefinition.findUnique({ where: { id } });
  }

  async create(data: Prisma.TrendingDefinitionCreateInput): Promise<TrendingDefinition> {
    return prisma.trendingDefinition.create({ data });
  }

  async update(id: string, data: Prisma.TrendingDefinitionUpdateInput): Promise<TrendingDefinition> {
    return prisma.trendingDefinition.update({ where: { id }, data });
  }

  async delete(id: string): Promise<TrendingDefinition> {
    return prisma.trendingDefinition.delete({ where: { id } });
  }
}
