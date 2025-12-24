import { PrismaClient } from '@prisma/client';
import logger from '../utils/loggers';

let prismaInstance: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (prismaInstance) {
    return prismaInstance;
  }

  prismaInstance = new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  });

  // Handle disconnect errors
  prismaInstance.$on('disconnect', () => {
    logger.warn('Prisma disconnected');
    prismaInstance = null;
  });

  return prismaInstance;
}

export async function connectPrisma(): Promise<PrismaClient> {
  try {
    const prisma = getPrismaClient();
    // Test connection
    await prisma.$queryRaw`db.adminCommand({ ping: 1 })`;
    logger.info('Prisma connected to MongoDB');
    return prisma;
  } catch (error) {
    logger.error('Prisma connection failed:', error);
    throw error;
  }
}

export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
    logger.info('Prisma disconnected');
  }
}