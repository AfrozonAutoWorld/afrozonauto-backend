export const TYPES = {

    // user types
    UserRepository: Symbol.for('UserRepository'),
    UserService: Symbol.for('UserService'),
    AuthService: Symbol.for('AuthService'),
    UserController: Symbol.for('UserController'),
    AuthController: Symbol.for('AuthController'),
    AppleAuthService: Symbol.for('AppleAuthService'),
    GoogleAuthService: Symbol.for('GoogleAuthService'),
    ProfileRepository: Symbol.for('ProfileRepository'),
    ProfileService: Symbol.for('ProfileService'),
    ProfileController: Symbol.for('ProfileController'),
    // utilities services
    MailService: Symbol.for('MailService'),
    TokenService: Symbol.for('TokenService'),
    Jtoken: Symbol.for('Jtoken'),
    // user types
    AddressRepository: Symbol.for('AddressRepository'),
    AddressService: Symbol.for('AddressService'),
    AddressController: Symbol.for('AddressController'),
    // vehicle types
    VehicleRepository: Symbol.for('VehicleRepository'),
    SavedVehicleRepository: Symbol.for('SavedVehicleRepository'),
    VehicleService: Symbol.for('VehicleService'),
    VehicleController: Symbol.for('VehicleController'),
    AutoDevService: Symbol.for('AutoDevService'),
    RedisCacheService: Symbol.for('RedisCacheService'),
    TrendingDefinitionRepository: Symbol.for('TrendingDefinitionRepository'),
    RecommendedDefinitionRepository: Symbol.for('RecommendedDefinitionRepository'),
    VehicleCategoryRepository: Symbol.for('VehicleCategoryRepository'),
    TrendingService: Symbol.for('TrendingService'),
    RecommendedService: Symbol.for('RecommendedService'),
    CategoryService: Symbol.for('CategoryService'),
    TrendingDefinitionController: Symbol.for('TrendingDefinitionController'),
    RecommendedDefinitionController: Symbol.for('RecommendedDefinitionController'),
    VehicleCategoryController: Symbol.for('VehicleCategoryController'),
   
    PaymentRepository: Symbol.for('PaymentRepository'),
    PaymentService: Symbol.for('PaymentService'),
    PaymentController: Symbol.for('PaymentController'),
    
    ExchangeRateService: Symbol.for('ExchangeRateService'),
    StripeProvider: Symbol.for('StripeProvider'),
    PaystackProvider: Symbol.for('PaystackProvider'),
    
    TestimonialService: Symbol.for('TestimonialService'),
    TestimonialController: Symbol.for('TestimonialController'),
    TestimonialRepository: Symbol.for('TestimonialRepository'),

    OrderRepository: Symbol.for('OrderRepository'),
    OrderService: Symbol.for('OrderService'),
    OrderController: Symbol.for('OrderController'),
    
    PricingConfigRepository: Symbol.for('PricingConfigRepository'),
    PricingConfigService: Symbol.for('PricingConfigService'),

    SourcingRequestRepository: Symbol.for('SourcingRequestRepository'),
    SourcingRequestService: Symbol.for('SourcingRequestService'),
    SourcingRequestController: Symbol.for('SourcingRequestController'),
};