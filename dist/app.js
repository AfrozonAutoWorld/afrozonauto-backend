"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const celebrate_1 = require("celebrate");
const secrets_1 = require("./secrets");
const ApiError_1 = require("./utils/ApiError");
const AuthRoutes_1 = __importDefault(require("./routes/AuthRoutes"));
const VehicleRoutes_1 = __importDefault(require("./routes/VehicleRoutes"));
const AddressRoutes_1 = __importDefault(require("./routes/AddressRoutes"));
const PaymentRoutes_1 = __importDefault(require("./routes/PaymentRoutes"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const ProfileRoutes_1 = __importDefault(require("./routes/ProfileRoutes"));
const loggers_1 = __importDefault(require("./utils/loggers"));
const UserRoutes_1 = __importDefault(require("./routes/UserRoutes"));
const TestimonialRoutes_1 = __importDefault(require("./routes/TestimonialRoutes"));
const OrderRoutes_1 = __importDefault(require("./routes/OrderRoutes"));
class App {
    constructor() {
        this.app = (0, express_1.default)();
        this.config();
        this.setupRoutes();
        this.setupDatabase();
        this.errorHandler();
    }
    config() {
        this.app.set('trust proxy', 1);
        const isProd = secrets_1.NODE_ENV === 'production';
        // Security headers
        this.app.use((0, helmet_1.default)({
            crossOriginResourcePolicy: { policy: 'cross-origin' },
            crossOriginEmbedderPolicy: false,
        }));
        // Rate limiting
        const limiter = (0, express_rate_limit_1.default)({
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
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        // Parse and clean origins
        const allowedOrigins = secrets_1.CORS_ORIGINS
            ? secrets_1.CORS_ORIGINS.split(',')
                .map(origin => origin.trim())
                .filter(origin => origin.length > 0)
            : [];
        // Log configuration on startup
        loggers_1.default.info('CORS Configuration', {
            isProd,
            allowedOrigins,
            raw: secrets_1.CORS_ORIGINS,
        });
        // CORS configuration - SIMPLIFIED VERSION
        const corsOptions = {
            origin: (origin, callback) => {
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
                loggers_1.default.error('CORS: Origin blocked', {
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
        this.app.use((0, cors_1.default)(corsOptions));
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
        this.app.use((0, celebrate_1.errors)());
    }
    setupRoutes() {
        this.app.get('/', (_, res) => {
            return res.send("welcome to Afrozon AutoGlobal");
        });
        this.app.use('/api/profile', ProfileRoutes_1.default);
        this.app.use('/api/auth', AuthRoutes_1.default);
        this.app.use('/api/vehicles', VehicleRoutes_1.default);
        this.app.use('/api/addresses', AddressRoutes_1.default);
        this.app.use('/api/testimonials', TestimonialRoutes_1.default);
        this.app.use('/api/payments', PaymentRoutes_1.default);
        this.app.use('/api/orders', OrderRoutes_1.default);
        this.app.use('/api/users', UserRoutes_1.default);
        // 404 handler - catch all unmatched routes
        this.app.use((req, res) => {
            res.status(404).json({
                success: false,
                error: 'Route not found',
                path: req.path
            });
        });
    }
    errorHandler() {
        // Validation error handler (celebrate/joi)
        this.app.use((err, req, res, next) => {
            if (err.joi) {
                const details = err.joi.details.map((d) => {
                    var _a, _b;
                    return ({
                        field: ((_a = d.context) === null || _a === void 0 ? void 0 : _a.label) || ((_b = d.context) === null || _b === void 0 ? void 0 : _b.key),
                        message: d.message.replace(/["]/g, '')
                    });
                });
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
        this.app.use((err, req, res, next) => {
            var _a, _b, _c, _d;
            if (err instanceof ApiError_1.ApiError) {
                return res.status(err.statusCode).json({
                    success: false,
                    message: err.message,
                    errors: ((_a = err.data) === null || _a === void 0 ? void 0 : _a.errors) || [],
                    details: ((_b = err.data) === null || _b === void 0 ? void 0 : _b.details) || null,
                    code: ((_c = err.data) === null || _c === void 0 ? void 0 : _c.code) || 'API_ERROR'
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
            if (err.name === 'ValidationError' || ((_d = err.code) === null || _d === void 0 ? void 0 : _d.startsWith('P'))) {
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
    setupDatabase() {
        mongoose_1.default.connect(secrets_1.DATABASE_URL || "", {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 30000,
        })
            .then(() => console.log('Connected to MongoDB'))
            .catch(err => console.error('MongoDB connection error:', err));
    }
    start(port) {
        this.app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    }
}
exports.default = App;
