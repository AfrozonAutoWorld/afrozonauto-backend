import { injectable } from 'inversify';
import prisma from '../db';
import { RecommendedDefinition, Prisma } from '../generated/prisma/client';

@injectable()
export class RecommendedDefinitionRepository {
  async findManyActive(): Promise<RecommendedDefinition[]> {
    return prisma.recommendedDefinition.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findMany(): Promise<RecommendedDefinition[]> {
    return prisma.recommendedDefinition.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findById(id: string): Promise<RecommendedDefinition | null> {
    return prisma.recommendedDefinition.findUnique({ where: { id } });
  }

  async create(data: Prisma.RecommendedDefinitionCreateInput): Promise<RecommendedDefinition> {
    return prisma.recommendedDefinition.create({ data });
  }

  async update(id: string, data: Prisma.RecommendedDefinitionUpdateInput): Promise<RecommendedDefinition> {
    return prisma.recommendedDefinition.update({ where: { id }, data });
  }

  async delete(id: string): Promise<RecommendedDefinition> {
    return prisma.recommendedDefinition.delete({ where: { id } });
  }
}
