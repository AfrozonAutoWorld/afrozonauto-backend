import { Response, NextFunction } from 'express';
import { ApiError } from './ApiError';
import { AuthenticatedRequest } from '../types/customRequest';
import { MulterError } from 'multer';
import loggers from './loggers';
import { NODE_ENV } from '../secrets';


export const asyncHandler = (fn: Function) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    // Log the error for debugging
    if (NODE_ENV == "development") {
      console.log(error)
      loggers.debug('Async handler caught error:', {
        path: req.path,
        method: req.method,
        error: error.message
      });
    }
    // If it's already an ApiError, pass it along
    if (error instanceof ApiError) {
      return next(error);
    }

    // Handle validation errors (e.g., from mongoose)
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return next(ApiError.validationError(errors, error));
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const message = `${field} already exists`;
      return next(ApiError.validationError([message], error));
    }

    // Handle CastError (invalid ObjectId)
    if (error.name === 'CastError') {
      const message = `Invalid ${error.path}: ${error.value}`;
      return next(ApiError.validationError([message], error));
    }

    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
      return next(ApiError.unauthorized('Invalid token'));
    }

    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Token expired'));
    }
    // Handle Multer errors nicely
    if (error instanceof MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return next(ApiError.fileTooLarge(
          'Each uploaded file must be less than 5MB',
          { field: error.field }
        ));
      } else {
        return next(ApiError.badRequest(error.message, { field: error.field }));
      }
    }
    // Axios / External API Errors
    if (error.isAxiosError) {
      const status = error.response?.status || 502;
      const message =
        error.code === 'ECONNABORTED'
          ? 'External service timeout'
          : error.response?.statusText || 'External service error';
      return next(
        status === 504
          ? ApiError.gatewayTimeout(message, error)
          : ApiError.badGateway(message, error)
      );
    }


    // Default to internal server error
    next(ApiError.internal(error?.message || 'Something went wrong', error));
  });
};