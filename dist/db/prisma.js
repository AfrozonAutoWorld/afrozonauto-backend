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
exports.getPrismaClient = getPrismaClient;
exports.connectPrisma = connectPrisma;
exports.disconnectPrisma = disconnectPrisma;
const client_1 = require("../generated/prisma/client");
const loggers_1 = __importDefault(require("../utils/loggers"));
let prismaInstance = null;
function getPrismaClient() {
    if (prismaInstance) {
        return prismaInstance;
    }
    prismaInstance = new client_1.PrismaClient({
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn']
            : ['error'],
    });
    return prismaInstance;
}
function connectPrisma() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const prisma = getPrismaClient();
            // Test connection by running a simple query
            yield prisma.$connect();
            loggers_1.default.info('Prisma connected to MongoDB');
            return prisma;
        }
        catch (error) {
            loggers_1.default.error('Prisma connection failed:', error);
            throw error;
        }
    });
}
function disconnectPrisma() {
    return __awaiter(this, void 0, void 0, function* () {
        if (prismaInstance) {
            yield prismaInstance.$disconnect();
            prismaInstance = null;
            loggers_1.default.info('Prisma disconnected');
        }
    });
}
