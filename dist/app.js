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
