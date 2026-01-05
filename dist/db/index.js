"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
exports.closeDatabase = closeDatabase;
const mongodb_1 = require("./mongodb");
const prisma_1 = require("./prisma");
const loggers_1 = __importDefault(require("../utils/loggers"));
function initializeDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            loggers_1.default.info('Initializing database...');
            // Connect to MongoDB
            try {
                yield (0, mongodb_1.connectMongoDB)();
            }
            catch (error) {
                loggers_1.default.warn('MongoDB connection failed (Mongoose), continuing with Prisma only');
            }
            // Connect Prisma (required)
            yield (0, prisma_1.connectPrisma)();
            loggers_1.default.info('✓ Database initialized successfully');
        }
        catch (error) {
            loggers_1.default.error('✗ Database initialization failed:', error);
            process.exit(1);
        }
    });
}
function closeDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, mongodb_1.disconnectMongoDB)();
            yield (0, prisma_1.disconnectPrisma)();
            loggers_1.default.info('Database connections closed');
        }
        catch (error) {
            loggers_1.default.error('Error closing database:', error);
        }
    });
}
exports.default = (0, prisma_1.getPrismaClient)();
