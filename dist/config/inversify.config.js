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
const TrendingDefinitionRepository_1 = require("../repositories/TrendingDefinitionRepository");
const VehicleCategoryRepository_1 = require("../repositories/VehicleCategoryRepository");
const VehicleServiceDirect_1 = require("../services/VehicleServiceDirect");
const TrendingService_1 = require("../services/TrendingService");
const CategoryService_1 = require("../services/CategoryService");
const VehicleController_1 = require("../controllers/VehicleController");
const TrendingDefinitionController_1 = require("../controllers/TrendingDefinitionController");
const VehicleCategoryController_1 = require("../controllers/VehicleCategoryController");
const AutoDevService_1 = require("../services/AutoDevService");
const RedisCacheService_1 = require("../services/RedisCacheService");
const PaymentController_1 = require("../controllers/PaymentController");
const PaymentService_1 = require("../services/PaymentService");
const PaymentRepository_1 = require("../repositories/PaymentRepository");
const OrderRepository_1 = require("../repositories/OrderRepository");
const StripeProvider_1 = require("../services/StripeProvider");
const PaystackProvider_1 = require("../services/PaystackProvider");
const ProfileController_1 = require("../controllers/ProfileController");
const TestimonialRepository_1 = require("../repositories/TestimonialRepository");
const TestimonialService_1 = require("../services/TestimonialService");
const TestimonialController_1 = require("../controllers/TestimonialController");
const OrderService_1 = require("../services/OrderService");
const OrderController_1 = require("../controllers/OrderController");
const ExchangeRateService_1 = require("../services/ExchangeRateService");
const PricingConfigRepository_1 = require("../repositories/PricingConfigRepository");
const PricingConfigService_1 = require("../services/PricingConfigService");
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
container.bind(types_1.TYPES.ProfileController).to(ProfileController_1.ProfileController);
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
container.bind(types_1.TYPES.ExchangeRateService).to(ExchangeRateService_1.ExchangeRateService);
container.bind(types_1.TYPES.PricingConfigRepository).to(PricingConfigRepository_1.PricingConfigRepository);
container.bind(types_1.TYPES.PricingConfigService).to(PricingConfigService_1.PricingConfigService);
container.bind(types_1.TYPES.PaymentRepository).to(PaymentRepository_1.PaymentRepository);
container.bind(types_1.TYPES.StripeProvider).to(StripeProvider_1.StripeProvider);
container.bind(types_1.TYPES.PaystackProvider)
    .to(PaystackProvider_1.PaystackProvider)
    .inSingletonScope();
// Vehicle bindings
container.bind(types_1.TYPES.VehicleRepository).to(VehicleRepository_1.VehicleRepository);
container.bind(types_1.TYPES.TrendingDefinitionRepository).to(TrendingDefinitionRepository_1.TrendingDefinitionRepository);
container.bind(types_1.TYPES.VehicleCategoryRepository).to(VehicleCategoryRepository_1.VehicleCategoryRepository);
container.bind(types_1.TYPES.VehicleService).to(VehicleServiceDirect_1.VehicleServiceDirect);
container.bind(types_1.TYPES.TrendingService).to(TrendingService_1.TrendingService);
container.bind(types_1.TYPES.CategoryService).to(CategoryService_1.CategoryService);
container.bind(types_1.TYPES.VehicleController).to(VehicleController_1.VehicleController);
container.bind(types_1.TYPES.TrendingDefinitionController).to(TrendingDefinitionController_1.TrendingDefinitionController);
container.bind(types_1.TYPES.VehicleCategoryController).to(VehicleCategoryController_1.VehicleCategoryController);
container.bind(types_1.TYPES.AutoDevService).to(AutoDevService_1.AutoDevService);
container.bind(types_1.TYPES.RedisCacheService).to(RedisCacheService_1.RedisCacheService).inSingletonScope();
// Testimonial bindings
container.bind(types_1.TYPES.TestimonialRepository).to(TestimonialRepository_1.TestimonialRepository);
container.bind(types_1.TYPES.TestimonialService).to(TestimonialService_1.TestimonialService);
container.bind(types_1.TYPES.TestimonialController).to(TestimonialController_1.TestimonialController);
// Testimonial bindings
container.bind(types_1.TYPES.OrderRepository).to(OrderRepository_1.OrderRepository);
container.bind(types_1.TYPES.OrderService).to(OrderService_1.OrderService);
container.bind(types_1.TYPES.OrderController).to(OrderController_1.OrderController);
