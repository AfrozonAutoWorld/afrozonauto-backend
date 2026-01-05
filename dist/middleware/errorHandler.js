"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const loggers_1 = __importDefault(require("../utils/loggers"));
const errorHandler = (err, req, res, next) => {
    console.error('ErrorHandler:', err);
    loggers_1.default.info(`ErrorHandler: - ${err}`);
    // Joi Validation Error
    if (err.name === 'ValidationError' && Array.isArray(err.details)) {
        return res.status(400).json({
            status: false,
            message: 'Validation error',
            details: err.details,
        });
    }
    // Mongoose: CastError (e.g. invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(400).json({
            status: false,
            message: `Invalid ${err.path}: ${err.value}`,
        });
    }
    // Mongoose: Duplicate Key Error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0];
        return res.status(409).json({
            status: false,
            message: `Duplicate value for field: ${field}`,
        });
    }
    // Mongoose: ValidationError (schema validation)
    if (err.name === 'ValidationError' && err.errors) {
        const errors = Object.values(err.errors).map((el) => el.message);
        return res.status(400).json({
            status: false,
            message: 'Schema validation error',
            details: errors,
        });
    }
    // Mongoose: DocumentNotFoundError
    if (err.name === 'DocumentNotFoundError') {
        return res.status(404).json({
            status: false,
            message: 'Document not found',
        });
    }
    // Mongoose: MongoNetworkError
    if (err.name === 'MongoNetworkError') {
        return res.status(503).json({
            status: false,
            message: 'Database connection error',
        });
    }
    // Default handler
    return res.status(err.status || 500).json({
        status: false,
        message: err.message || 'Internal Server Error',
    });
};
exports.errorHandler = errorHandler;
