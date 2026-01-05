"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = void 0;
const ApiError_1 = require("./ApiError");
const multer_1 = require("multer");
const loggers_1 = __importDefault(require("./loggers"));
const secrets_1 = require("../secrets");
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((error) => {
            var _a, _b;
            // Log the error for debugging
            if (secrets_1.NODE_ENV == "development") {
                console.log(error);
                loggers_1.default.debug('Async handler caught error:', {
                    path: req.path,
                    method: req.method,
                    error: error.message
                });
            }
            // If it's already an ApiError, pass it along
            if (error instanceof ApiError_1.ApiError) {
                return next(error);
            }
            // Handle validation errors (e.g., from mongoose)
            if (error.name === 'ValidationError') {
                const errors = Object.values(error.errors).map((err) => err.message);
                return next(ApiError_1.ApiError.validationError(errors, error));
            }
            // Handle duplicate key errors
            if (error.code === 11000) {
                const field = Object.keys(error.keyValue)[0];
                const message = `${field} already exists`;
                return next(ApiError_1.ApiError.validationError([message], error));
            }
            // Handle CastError (invalid ObjectId)
            if (error.name === 'CastError') {
                const message = `Invalid ${error.path}: ${error.value}`;
                return next(ApiError_1.ApiError.validationError([message], error));
            }
            // Handle JWT errors
            if (error.name === 'JsonWebTokenError') {
                return next(ApiError_1.ApiError.unauthorized('Invalid token'));
            }
            if (error.name === 'TokenExpiredError') {
                return next(ApiError_1.ApiError.unauthorized('Token expired'));
            }
            // Handle Multer errors nicely
            if (error instanceof multer_1.MulterError) {
                if (error.code === 'LIMIT_FILE_SIZE') {
                    return next(ApiError_1.ApiError.fileTooLarge('Each uploaded file must be less than 5MB', { field: error.field }));
                }
                else {
                    return next(ApiError_1.ApiError.badRequest(error.message, { field: error.field }));
                }
            }
            // Axios / External API Errors
            if (error.isAxiosError) {
                const status = ((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) || 502;
                const message = error.code === 'ECONNABORTED'
                    ? 'External service timeout'
                    : ((_b = error.response) === null || _b === void 0 ? void 0 : _b.statusText) || 'External service error';
                return next(status === 504
                    ? ApiError_1.ApiError.gatewayTimeout(message, error)
                    : ApiError_1.ApiError.badGateway(message, error));
            }
            // Default to internal server error
            next(ApiError_1.ApiError.internal((error === null || error === void 0 ? void 0 : error.message) || 'Something went wrong', error));
        });
    };
};
exports.asyncHandler = asyncHandler;
