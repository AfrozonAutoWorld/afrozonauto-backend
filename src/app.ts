import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errors as celebrateErrors } from 'celebrate';
import { CORS_ORIGINS, DATABASE_URL, NODE_ENV } from "./secrets"
import { ApiError } from './utils/ApiError';
import AuthRoutes from './routes/AuthRoutes';
import VehicleRoutes from './routes/VehicleRoutes';
import AddressRoutes from './routes/AddressRoutes';
import PaymentRoutes from './routes/PaymentRoutes';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import ProfileRoutes from './routes/ProfileRoutes';
import loggers from './utils/loggers';
import UserRoutes from './routes/UserRoutes';
import TestimonialRoutes from './routes/TestimonialRoutes';
import OrderRoutes from './routes/OrderRoutes';

class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.config();
    this.setupRoutes();
    this.setupDatabase();
    this.errorHandler();
  }

  private config(): void {
    this.app.set('trust proxy', 1);
    const isProd = NODE_ENV === 'production';
    
    // Security headers
    this.app.use(
      helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        crossOriginEmbedderPolicy: false,
      })
    );
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 200,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: 'Too many requests, please try again later.',
      },
    });
    
    this.app.use('/api', limiter);
    
    // Body parsers
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(cookieParser());
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
    // Parse and clean origins
    const allowedOrigins = CORS_ORIGINS
      ? CORS_ORIGINS.split(',')
          .map(origin => origin.trim())
          .filter(origin => origin.length > 0)
      : [];
    
    // Log configuration on startup
    loggers.info('CORS Configuration', {
      isProd,
      allowedOrigins,
      raw: CORS_ORIGINS,
    });
  
    // CORS configuration - SIMPLIFIED VERSION
    const corsOptions = {
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (mobile apps, Postman, curl, server-to-server)
        if (!origin) {
          return callback(null, true);
        }

        // Allow all origins in development
        if (!isProd) {
          return callback(null, true);
        }

        // In production, check if origin is allowed
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        // Check variations with/without trailing slash
        const originWithoutSlash = origin.endsWith('/') ? origin.slice(0, -1) : origin;
        const originWithSlash = !origin.endsWith('/') ? `${origin}/` : origin;

        if (allowedOrigins.includes(originWithoutSlash) || allowedOrigins.includes(originWithSlash)) {
          return callback(null, true);
        }

        // Origin not allowed
        loggers.error('CORS: Origin blocked', {
          origin,
          allowedOrigins,
          isProd,
        });

        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['Content-Range', 'X-Content-Range'],
      maxAge: 600,
      optionsSuccessStatus: 200,
    };

    // Apply CORS middleware
    this.app.use(cors(corsOptions));
    
    // Handle preflight requests manually (REMOVED WILDCARD ISSUE)
    this.app.use((req, res, next) => {
      if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        res.header('Access-Control-Max-Age', '600');
        return res.status(200).json({});
      }
      next();
    });
    
    // Celebrate errors
    this.app.use(celebrateErrors());
  }

  private setupRoutes(): void {
    this.app.get('/', (_, res) => {
      return res.send("welcome to Afrozon AutoGlobal");
    });

    this.app.use('/api/profile', ProfileRoutes);
    this.app.use('/api/auth', AuthRoutes);
    this.app.use('/api/vehicles', VehicleRoutes);
    this.app.use('/api/addresses', AddressRoutes);
    this.app.use('/api/testimonials', TestimonialRoutes);
    this.app.use('/api/payments', PaymentRoutes);
    this.app.use('/api/orders', OrderRoutes);
    this.app.use('/api/users', UserRoutes);

    // 404 handler - catch all unmatched routes
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({ 
        success: false,
        error: 'Route not found',
        path: req.path 
      });
    });
  }

  private errorHandler(): void {
    // Validation error handler (celebrate/joi)
    this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      if (err.joi) {
        const details = err.joi.details.map((d: any) => ({
          field: d.context?.label || d.context?.key,
          message: d.message.replace(/["]/g, '')
        }));
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          message: 'One or more fields are invalid or missing.',
          details
        });
      }
      next(err);
    });

    // API Error handler
    this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
          success: false,
          message: err.message,
          errors: err.data?.errors || [],
          details: err.data?.details || null,
          code: err.data?.code || 'API_ERROR'
        });
      }

      // CORS errors
      if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
          success: false,
          message: 'CORS policy: Origin not allowed'
        });
      }

      // Prisma/Mongoose errors
      if (err.name === 'ValidationError' || err.code?.startsWith('P')) {
        return res.status(400).json({
          success: false,
          message: err.message || 'Validation error',
          details: err.errors || null
        });
      }

      // Default error
      console.error("Unhandled Error:", err);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
      });
    });
  }

  private setupDatabase(): void {
    mongoose.connect(DATABASE_URL || "", {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
    })
      .then(() => console.log('Connected to MongoDB'))
      .catch(err => console.error('MongoDB connection error:', err));
  }

  public start(port: number): void {
    this.app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  }
}

export default App;