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
exports.connectMongoDB = connectMongoDB;
exports.disconnectMongoDB = disconnectMongoDB;
exports.getMongoConnection = getMongoConnection;
const mongoose_1 = __importDefault(require("mongoose"));
const loggers_1 = __importDefault(require("../utils/loggers"));
const secrets_1 = require("../secrets");
const ApiError_1 = require("../utils/ApiError");
let mongoConnection = null;
function connectMongoDB() {
    return __awaiter(this, void 0, void 0, function* () {
        if (mongoConnection) {
            loggers_1.default.info('Using existing MongoDB connection');
            return mongoConnection;
        }
        try {
            const uri = secrets_1.DATABASE_URL;
            if (!uri) {
                throw ApiError_1.ApiError.notFound('MONGODB_URI is not defined');
            }
            yield mongoose_1.default.connect(uri, {
                maxPoolSize: 10,
                minPoolSize: 5,
            });
            mongoConnection = mongoose_1.default.connection;
            mongoConnection.on('error', (err) => {
                loggers_1.default.error('MongoDB connection error:', err);
                mongoConnection = null;
            });
            mongoConnection.on('disconnected', () => {
                loggers_1.default.warn('MongoDB disconnected');
                mongoConnection = null;
            });
            loggers_1.default.info('MongoDB connected successfully');
            return mongoConnection;
        }
        catch (error) {
            loggers_1.default.error('Failed to connect to MongoDB:', error);
            throw error;
        }
    });
}
function disconnectMongoDB() {
    return __awaiter(this, void 0, void 0, function* () {
        if (mongoConnection) {
            yield mongoose_1.default.disconnect();
            mongoConnection = null;
            loggers_1.default.info('MongoDB disconnected');
        }
    });
}
function getMongoConnection() {
    return mongoConnection;
}
