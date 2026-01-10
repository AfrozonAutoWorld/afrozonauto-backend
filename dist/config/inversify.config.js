"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.container = void 0;
const inversify_1 = require("inversify");
const types_1 = require("./types");
// User dependencies
const UserService_1 = require("../services/UserService");
const UserController_1 = require("../controllers/UserController");
const AuthController_1 = require("../controllers/AuthController");
const AddressController_1 = require("../controllers/AddressController");
const AuthService_1 = require("../services/AuthService");
const UserRepository_1 = require("../repositories/UserRepository");
const ProfileRepository_1 = require("../repositories/ProfileRepository");
const AddressRepository_1 = require("../repositories/AddressRepository");
const ProfileService_1 = require("../services/ProfileService");
const AddressService_1 = require("../services/AddressService");
const TokenService_1 = __importDefault(require("../services/TokenService"));
const MailService_1 = require("../services/MailService");
const AppleAuthService_1 = require("../services/AppleAuthService");
const GoogleAuthService_1 = require("../services/GoogleAuthService");
const Jtoken_1 = __importDefault(require("../middleware/Jtoken"));
// Vehicle dependencies
const VehicleRepository_1 = require("../repositories/VehicleRepository");
const VehicleService_1 = require("../services/VehicleService");
const VehicleController_1 = require("../controllers/VehicleController");
const AutoDevService_1 = require("../services/AutoDevService");
const RedisCacheService_1 = require("../services/RedisCacheService");
const PaymentController_1 = require("../controllers/PaymentController");
const PaymentService_1 = require("../services/PaymentService");
const PaymentRepository_1 = require("../repositories/PaymentRepository");
const StripeProvider_1 = require("../services/StripeProvider");
const PaystackProvider_1 = require("../services/PaystackProvider");
const container = new inversify_1.Container();
exports.container = container;
container.bind(types_1.TYPES.UserRepository).to(UserRepository_1.UserRepository);
container.bind(types_1.TYPES.ProfileRepository).to(ProfileRepository_1.ProfileRepository);
container.bind(types_1.TYPES.AddressRepository).to(AddressRepository_1.AddressRepository);
container.bind(types_1.TYPES.UserService).to(UserService_1.UserService);
container.bind(types_1.TYPES.AuthService).to(AuthService_1.AuthService);
container.bind(types_1.TYPES.AuthController).to(AuthController_1.AuthController);
container.bind(types_1.TYPES.UserController).to(UserController_1.UserController);
container.bind(types_1.TYPES.AddressController).to(AddressController_1.AddressController);
container.bind(types_1.TYPES.ProfileService).to(ProfileService_1.ProfileService);
container.bind(types_1.TYPES.AddressService).to(AddressService_1.AddressService);
// Bind services
container.bind(types_1.TYPES.Jtoken).to(Jtoken_1.default);
container.bind(types_1.TYPES.MailService).to(MailService_1.MailService);
container.bind(types_1.TYPES.AppleAuthService).to(AppleAuthService_1.AppleAuthService);
container.bind(types_1.TYPES.GoogleAuthService).to(GoogleAuthService_1.GoogleAuthService);
container.bind(types_1.TYPES.TokenService).to(TokenService_1.default);
// payments
container.bind(types_1.TYPES.PaymentController).to(PaymentController_1.PaymentController);
container.bind(types_1.TYPES.PaymentService).to(PaymentService_1.PaymentService);
container.bind(types_1.TYPES.PaymentRepository).to(PaymentRepository_1.PaymentRepository);
container.bind(types_1.TYPES.StripeProvider).to(StripeProvider_1.StripeProvider);
container.bind(types_1.TYPES.PaystackProvider).to(PaystackProvider_1.PaystackProvider);
// Vehicle bindings
container.bind(types_1.TYPES.VehicleRepository).to(VehicleRepository_1.VehicleRepository);
container.bind(types_1.TYPES.VehicleService).to(VehicleService_1.VehicleService);
container.bind(types_1.TYPES.VehicleController).to(VehicleController_1.VehicleController);
container.bind(types_1.TYPES.AutoDevService).to(AutoDevService_1.AutoDevService);
container.bind(types_1.TYPES.RedisCacheService).to(RedisCacheService_1.RedisCacheService).inSingletonScope();
