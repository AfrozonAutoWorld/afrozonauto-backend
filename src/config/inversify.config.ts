import { Container } from 'inversify';
import { TYPES } from './types';


// User dependencies
import { UserService } from '../services/UserService';
import { UserController } from '../controllers/UserController';
import { AuthController } from '../controllers/AuthController';
import { AddressController } from '../controllers/AddressController';
import { AuthService } from '../services/AuthService';
import { UserRepository } from '../repositories/UserRepository';
import { ProfileRepository } from '../repositories/ProfileRepository';
import { AddressRepository } from '../repositories/AddressRepository';
import { ProfileService } from '../services/ProfileService';
import { AddressService } from '../services/AddressService';
import TokenService from '../services/TokenService';
import { MailService } from '../services/MailService';
import {AppleAuthService} from '../services/AppleAuthService';
import { GoogleAuthService } from '../services/GoogleAuthService';
import Jtoken from '../middleware/Jtoken';

// Vehicle dependencies
import { VehicleRepository } from '../repositories/VehicleRepository';
import { VehicleService } from '../services/VehicleService';
import { VehicleController } from '../controllers/VehicleController';
import { AutoDevService } from '../services/AutoDevService';
import { RedisCacheService } from '../services/RedisCacheService';
import { PaymentController } from '../controllers/PaymentController';
import { PaymentService } from '../services/PaymentService';
import { PaymentRepository } from '../repositories/PaymentRepository';
import { OrderRepository } from '../repositories/OrderRepository';
import { StripeProvider } from '../services/StripeProvider';
import { PaystackProvider } from '../services/PaystackProvider';
import { ProfileController } from '../controllers/ProfileController';
import { TestimonialRepository } from '../repositories/TestimonialRepository';
import { TestimonialService } from '../services/TestimonialService';
import { TestimonialController } from '../controllers/TestimonialController';
import { OrderService } from '../services/OrderService';
import { OrderController } from '../controllers/OrderController';
import { ExchangeRateService } from '../services/ExchangeRateService';
import { PricingConfigRepository } from '../repositories/PricingConfigRepository';
import { PricingConfigService } from '../services/PricingConfigService';



const container = new Container();


container.bind<UserRepository>(TYPES.UserRepository).to(UserRepository);
container.bind<ProfileRepository>(TYPES.ProfileRepository).to(ProfileRepository);
container.bind<AddressRepository>(TYPES.AddressRepository).to(AddressRepository);
container.bind<UserService>(TYPES.UserService).to(UserService);
container.bind<AuthService>(TYPES.AuthService).to(AuthService);
container.bind<AuthController>(TYPES.AuthController).to(AuthController);
container.bind<UserController>(TYPES.UserController).to(UserController);
container.bind<AddressController>(TYPES.AddressController).to(AddressController);
container.bind<ProfileService>(TYPES.ProfileService).to(ProfileService);
container.bind<ProfileController>(TYPES.ProfileController).to(ProfileController);
container.bind<AddressService>(TYPES.AddressService).to(AddressService);
// Bind services
container.bind<Jtoken>(TYPES.Jtoken).to(Jtoken);
container.bind<MailService>(TYPES.MailService).to(MailService);
container.bind<AppleAuthService>(TYPES.AppleAuthService).to(AppleAuthService);
container.bind<GoogleAuthService>(TYPES.GoogleAuthService).to(GoogleAuthService);
container.bind<TokenService>(TYPES.TokenService).to(TokenService);
// payments
container.bind<PaymentController>(TYPES.PaymentController).to(PaymentController);
container.bind<PaymentService>(TYPES.PaymentService).to(PaymentService);
container.bind<ExchangeRateService>(TYPES.ExchangeRateService).to(ExchangeRateService);
container.bind<PricingConfigRepository>(TYPES.PricingConfigRepository).to(PricingConfigRepository);
container.bind<PricingConfigService>(TYPES.PricingConfigService).to(PricingConfigService);
container.bind<PaymentRepository>(TYPES.PaymentRepository).to(PaymentRepository);
container.bind<StripeProvider>(TYPES.StripeProvider).to(StripeProvider);
container.bind<PaystackProvider>(TYPES.PaystackProvider)
  .to(PaystackProvider)
  .inSingletonScope();
// Vehicle bindings
container.bind<VehicleRepository>(TYPES.VehicleRepository).to(VehicleRepository);
container.bind<VehicleService>(TYPES.VehicleService).to(VehicleService);
container.bind<VehicleController>(TYPES.VehicleController).to(VehicleController);
container.bind<AutoDevService>(TYPES.AutoDevService).to(AutoDevService);
container.bind<RedisCacheService>(TYPES.RedisCacheService).to(RedisCacheService).inSingletonScope();
// Testimonial bindings
container.bind<TestimonialRepository>(TYPES.TestimonialRepository).to(TestimonialRepository);
container.bind<TestimonialService>(TYPES.TestimonialService).to(TestimonialService);
container.bind<TestimonialController>(TYPES.TestimonialController).to(TestimonialController);
// Testimonial bindings
container.bind<OrderRepository>(TYPES.OrderRepository).to(OrderRepository);
container.bind<OrderService>(TYPES.OrderService).to(OrderService);
container.bind<OrderController>(TYPES.OrderController).to(OrderController);


export { container };