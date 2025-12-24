import { NODE_ENV } from "../secrets"

export interface ApiErrorData {
  errors?: string[];
  details?: any;
  code?: string;
  field?: string;
  timestamp?: string;
  path?: string;
}

export class ApiError extends Error {
  statusCode: number;
  data: ApiErrorData;
  success: boolean;
  isOperational: boolean;

  constructor(statusCode: number, message: string, data?: ApiErrorData, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.data = data || {};
    this.success = false;
    this.isOperational = isOperational;
    this.name = this.constructor.name;

    // Ensure 'errors' is always an array
    if (this.data.errors && !Array.isArray(this.data.errors)) {
      this.data.errors = [this.data.errors];
    }

    // Add timestamp
    this.data.timestamp = new Date().toISOString();

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  // 400 - Bad Request
  static badRequest(message: string = "Bad request", details?: any): ApiError {
    return new ApiError(400, message, {
      errors: [message],
      details,
      code: "BAD_REQUEST",
    });
  }

  // 403 - Forbidden
  static forbidden(message: string = "Forbidden", details?: any): ApiError {
    return new ApiError(403, message, {
      errors: [message],
      details,
      code: "FORBIDDEN",
    });
  }

  // Helper method to create validation errors
  static validationError(errors: string[] | string, details?: any): ApiError {
    const errorArray = Array.isArray(errors) ? errors : [errors];
    return new ApiError(422, 'Validation failed', {
      errors: errorArray, // Now it's always an array
      details,
      code: 'VALIDATION_ERROR'
    });
  }

  // Helper method to create not found errors
  static notFound(message: string = 'Resource not found', details?: any): ApiError {
    return new ApiError(404, message, {
      errors: [message],
      details,
      code: 'NOT_FOUND'
    });
  }

  // Helper method to create unauthorized errors
  static unauthorized(message: string = 'Unauthorized', details?: any): ApiError {
    return new ApiError(401, message, {
      errors: [message],
      details,
      code: 'UNAUTHORIZED'
    });
  }

  // Helper method to create internal server errors
  static internal(message: string = 'Internal server error', details?: any): ApiError {
    return new ApiError(500, message, {
      errors: [message],
      details,
      code: 'INTERNAL_ERROR'
    });
  }

  // You might also want to add these commonly used error types:

  // 409 - Conflict
  static conflict(message: string = 'Conflict', details?: any): ApiError {
    return new ApiError(409, message, {
      errors: [message],
      details,
      code: 'CONFLICT'
    });
  }

  // 429 - Too Many Requests
  static tooManyRequests(message: string = 'Too many requests', details?: any): ApiError {
    return new ApiError(429, message, {
      errors: [message],
      details,
      code: 'TOO_MANY_REQUESTS'
    });
  }

  // 413 - Payload Too Large (for file uploads)
  static fileTooLarge(
    message: string = 'Uploaded file is too large',
    details?: any
  ): ApiError {
    return new ApiError(413, message, {
      errors: [message],
      details,
      code: 'FILE_TOO_LARGE'
    });
  }

  // 415 - Unsupported file type
  static unsupportedMedia(message = 'Unsupported file format', details?: any) {
    return new ApiError(415, message, {
      errors: [message],
      details,
      code: 'UNSUPPORTED_MEDIA_TYPE'
    });
  }


  // 503 - Service Unavailable
  static serviceUnavailable(message = "Service temporarily unavailable", details?: any): ApiError {
    return new ApiError(503, message, {
      errors: ["The service is temporarily down. Please try again later."],
      details: NODE_ENV === "development" ? details : undefined,
      code: "SERVICE_UNAVAILABLE",
    });
  }


  // 502 - Bad Gateway
  static badGateway(message: string = 'Bad gateway', details?: any): ApiError {
    return new ApiError(502, message, {
      errors: ['External service error. Please try again later.'],
      details: process.env.NODE_ENV === 'development' ? details : undefined,
      code: 'BAD_GATEWAY'
    });
  }

  // 504 - Gateway Timeout
  static gatewayTimeout(message = "Gateway timeout", details?: any): ApiError {
    return new ApiError(504, message, {
      errors: ["The request took too long to complete. Please try again later."],
      details: NODE_ENV === "development" ? details : undefined,
      code: "GATEWAY_TIMEOUT",
    });
  }

  // Convert to JSON-safe response
  toJSON() {
    const base = {
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
      errors: this.data.errors,
      code: this.data.code,
      timestamp: this.data.timestamp,
    };

    // Include sensitive data only in development
    if (NODE_ENV === "development") {
      return {
        ...base,
        path: this.data.path,
        stack: this.stack,
        details: this.data.details,
      };
    }

    // Hide path and stack in production
    return base;
  }
}