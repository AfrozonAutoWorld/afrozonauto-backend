import { connectMongoDB, disconnectMongoDB } from './mongodb';
import { connectPrisma, disconnectPrisma, getPrismaClient } from './prisma';
import logger from '../utils/loggers';

export async function initializeDatabase() {
  try {
    logger.info('Initializing database...');

    // Connect to MongoDB
    try {
      await connectMongoDB();
    } catch (error) {
      logger.warn('MongoDB connection failed (Mongoose), continuing with Prisma only');
    }

    // Connect Prisma (required)
    await connectPrisma();

    logger.info('✓ Database initialized successfully');
  } catch (error) {
    logger.error('✗ Database initialization failed:', error);
    process.exit(1);
  }
}

export async function closeDatabase() {
  try {
    await disconnectMongoDB();
    await disconnectPrisma();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error closing database:', error);
  }
}
export default getPrismaClient()
