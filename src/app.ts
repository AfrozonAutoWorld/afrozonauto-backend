import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { errors as celebrateErrors } from 'celebrate';
import { CORS_ORIGINS, DATABASE_URL, NODE_ENV } from "./secrets"

import { ApiError } from './utils/ApiError';
// import UserRoutes from './routes/UserRoutes';
// import ProfileRoutes from './routes/ProfileRoutes';
import AuthRoutes from './routes/AuthRoutes';
import VehicleRoutes from './routes/VehicleRoutes';
import AddressRoutes from './routes/AddressRoutes';
import PaymentRoutes from './routes/PaymentRoutes';

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import ProfileRoutes from './routes/ProfileRoutes';
import loggers from './utils/loggers';
import UserRoutes from './routes/UserRoutes';

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
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 200, // requests per IP
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: 'Too many requests, please try again later.',
      },
    });
    this.app.use('/api', limiter);
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(
      cors({
        origin: '*',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      })
    );

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
      this.app.use(
        cors({
          origin: (origin, callback) => {
            // Log every CORS request for debugging
            loggers.info('CORS Request', {
              origin,
              isProd,
              allowedOrigins,
            });
  
            // Allow requests with no origin (mobile apps, Postman, curl, server-to-server)
            if (!origin) {
              loggers.info('CORS: Allowing request with no origin');
              return callback(null, true);
            }
  
            // Allow all origins in development
            if (!isProd) {
              loggers.info('CORS: Allowing origin (dev mode)', { origin });
              return callback(null, true);
            }
  
            // Check if origin is allowed in production
            if (allowedOrigins.includes(origin)) {
              loggers.info('CORS: Origin allowed', { origin });
              return callback(null, true);
            }
  
            // Check with trailing slash removed (common mismatch)
            const originWithoutSlash = origin.endsWith('/')
              ? origin.slice(0, -1)
              : origin;
  
            if (allowedOrigins.includes(originWithoutSlash)) {
              loggers.info('CORS: Origin allowed (without trailing slash)', { origin });
              return callback(null, true);
            }
  
            // Check with trailing slash added (another common mismatch)
            const originWithSlash = !origin.endsWith('/')
              ? `${origin}/`
              : origin;
  
            if (allowedOrigins.includes(originWithSlash)) {
              loggers.info('CORS: Origin allowed (with trailing slash)', { origin });
              return callback(null, true);
            }
  
            // Origin not allowed
            loggers.error('CORS: Origin blocked', {
              origin,
              allowedOrigins,
              isProd,
            });
  
            return callback(
              new ApiError(403, `CORS policy: Origin ${origin} is not allowed`)
            );
          },
          credentials: true,
          methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
          exposedHeaders: ['Content-Range', 'X-Content-Range'],
          maxAge: 600, // Cache preflight requests for 10 minutes
        })
      );
      // Handle preflight requests explicitly
      this.app.options('*', cors());
    this.app.use(celebrateErrors());
  }

  private setupRoutes(): void {
 
    this.app.get('/', (_, res) => {
      return res.send("welcome to Afrozon AutoGlobal");
    });

    // this.app.use('/api/users', UserRoutes);
    this.app.use('/api/profile', ProfileRoutes);
    this.app.use('/api/auth', AuthRoutes);
    this.app.use('/api/vehicles', VehicleRoutes);
    this.app.use('/api/addresses', AddressRoutes);
    this.app.use('/api/payments', PaymentRoutes);
    this.app.use('/api/users', UserRoutes);

    // 404 handler - catch all unmatched routes
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({ 
        success: false,
        error: 'Route not found',
        path: req.path 
      });
    });

    // Validation error handler (celebrate/joi)
    this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      if (err.joi) {
        const details = err.joi.details.map((d: any) => ({
          field: d.context?.label || d.context?.key,
          message: d.message.replace(/["]/g, '')
        }));
        return res.status(400).json({
          error: 'Validation failed',
          message: 'One or more fields are invalid or missing.',
          details
        });
      }
      next(err);
    });
  }

  private errorHandler(): void {
    // Final catch-all error handler that forces JSON output
    this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      console.error("ErrorHandler:", err);

      if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
          success: false,
          message: err.message,
          errors: err.data?.errors || [],
          details: err.data?.details || null,
          code: err.data?.code || 'API_ERROR'
        });
      }

      // fallback internal server error
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: err.message || "Something went wrong"
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