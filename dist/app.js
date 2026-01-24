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
// import UserRoutes from './routes/UserRoutes';
// import ProfileRoutes from './routes/ProfileRoutes';
const AuthRoutes_1 = __importDefault(require("./routes/AuthRoutes"));
const VehicleRoutes_1 = __importDefault(require("./routes/VehicleRoutes"));
const AddressRoutes_1 = __importDefault(require("./routes/AddressRoutes"));
const PaymentRoutes_1 = __importDefault(require("./routes/PaymentRoutes"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const ProfileRoutes_1 = __importDefault(require("./routes/ProfileRoutes"));
const loggers_1 = __importDefault(require("./utils/loggers"));
const UserRoutes_1 = __importDefault(require("./routes/UserRoutes"));
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
        const limiter = (0, express_rate_limit_1.default)({
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
        this.app.use(express_1.default.json());
        this.app.use(express_1.default.urlencoded({ extended: true }));
        this.app.use((0, cors_1.default)({
            origin: '*',
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        }));
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
        this.app.use((0, cors_1.default)({
            origin: (origin, callback) => {
                // Log every CORS request for debugging
                loggers_1.default.info('CORS Request', {
                    origin,
                    isProd,
                    allowedOrigins,
                });
                // Allow requests with no origin (mobile apps, Postman, curl, server-to-server)
                if (!origin) {
                    loggers_1.default.info('CORS: Allowing request with no origin');
                    return callback(null, true);
                }
                // Allow all origins in development
                if (!isProd) {
                    loggers_1.default.info('CORS: Allowing origin (dev mode)', { origin });
                    return callback(null, true);
                }
                // Check if origin is allowed in production
                if (allowedOrigins.includes(origin)) {
                    loggers_1.default.info('CORS: Origin allowed', { origin });
                    return callback(null, true);
                }
                // Check with trailing slash removed (common mismatch)
                const originWithoutSlash = origin.endsWith('/')
                    ? origin.slice(0, -1)
                    : origin;
                if (allowedOrigins.includes(originWithoutSlash)) {
                    loggers_1.default.info('CORS: Origin allowed (without trailing slash)', { origin });
                    return callback(null, true);
                }
                // Check with trailing slash added (another common mismatch)
                const originWithSlash = !origin.endsWith('/')
                    ? `${origin}/`
                    : origin;
                if (allowedOrigins.includes(originWithSlash)) {
                    loggers_1.default.info('CORS: Origin allowed (with trailing slash)', { origin });
                    return callback(null, true);
                }
                // Origin not allowed
                loggers_1.default.error('CORS: Origin blocked', {
                    origin,
                    allowedOrigins,
                    isProd,
                });
                return callback(new ApiError_1.ApiError(403, `CORS policy: Origin ${origin} is not allowed`));
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
            exposedHeaders: ['Content-Range', 'X-Content-Range'],
            maxAge: 600, // Cache preflight requests for 10 minutes
        }));
        // Handle preflight requests explicitly
        this.app.options('*', (0, cors_1.default)());
        this.app.use((0, celebrate_1.errors)());
    }
    setupRoutes() {
        this.app.get('/', (_, res) => {
            return res.send("welcome to Afrozon AutoGlobal");
        });
        // this.app.use('/api/users', UserRoutes);
        this.app.use('/api/profile', ProfileRoutes_1.default);
        this.app.use('/api/auth', AuthRoutes_1.default);
        this.app.use('/api/vehicles', VehicleRoutes_1.default);
        this.app.use('/api/addresses', AddressRoutes_1.default);
        this.app.use('/api/payments', PaymentRoutes_1.default);
        this.app.use('/api/users', UserRoutes_1.default);
        // 404 handler - catch all unmatched routes
        this.app.use((req, res) => {
            res.status(404).json({
                success: false,
                error: 'Route not found',
                path: req.path
            });
        });
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
                    error: 'Validation failed',
                    message: 'One or more fields are invalid or missing.',
                    details
                });
            }
            next(err);
        });
    }
    errorHandler() {
        // Final catch-all error handler that forces JSON output
        this.app.use((err, req, res, next) => {
            var _a, _b, _c;
            console.error("ErrorHandler:", err);
            if (err instanceof ApiError_1.ApiError) {
                return res.status(err.statusCode).json({
                    success: false,
                    message: err.message,
                    errors: ((_a = err.data) === null || _a === void 0 ? void 0 : _a.errors) || [],
                    details: ((_b = err.data) === null || _b === void 0 ? void 0 : _b.details) || null,
                    code: ((_c = err.data) === null || _c === void 0 ? void 0 : _c.code) || 'API_ERROR'
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
