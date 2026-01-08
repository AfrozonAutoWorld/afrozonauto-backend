import mongoose, { Connection } from 'mongoose';
import logger from '../utils/loggers';
import {DATABASE_URL} from "../secrets"
import { ApiError } from '../utils/ApiError';
let mongoConnection: Connection | null = null;

export async function connectMongoDB(): Promise<Connection> {
  if (mongoConnection) {
    logger.info('Using existing MongoDB connection');
    return mongoConnection;
  }

  try {
    const uri = DATABASE_URL;
    if (!uri) {
      throw ApiError.notFound('MONGODB_URI is not defined');
    }

    await mongoose.connect(uri, {
      maxPoolSize: 10,
      minPoolSize: 5,
    });

    mongoConnection = mongoose.connection;

    mongoConnection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
      mongoConnection = null;
    });

    mongoConnection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      mongoConnection = null;
    });

    logger.info('MongoDB connected successfully');
    return mongoConnection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function disconnectMongoDB(): Promise<void> {
  if (mongoConnection) {
    await mongoose.disconnect();
    mongoConnection = null;
    logger.info('MongoDB disconnected');
  }
}

export function getMongoConnection(): Connection | null {
  return mongoConnection;
}