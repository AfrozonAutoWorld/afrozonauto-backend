import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { errors as celebrateErrors } from 'celebrate';
import { DATABASE_URL } from "./secrets"
import { ApiError } from './utils/ApiError';
// import UserRoutes from './routes/UserRoutes';
// import ProfileRoutes from './routes/ProfileRoutes';
import AuthRoutes from './routes/AuthRoutes';
import VehicleRoutes from './routes/VehicleRoutes';

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

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
    this.app.use(celebrateErrors());
  }

  private setupRoutes(): void {
 
    this.app.get('/', (_, res) => {
      return res.send("welcome to Afrozon AutoGlobal");
    });

    // this.app.use('/api/users', UserRoutes);
    // this.app.use('/api/profile', ProfileRoutes);
    this.app.use('/api/auth', AuthRoutes);
    this.app.use('/api/vehicles', VehicleRoutes);

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