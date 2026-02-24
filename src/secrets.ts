import dotenv from "dotenv";
dotenv.config({ path: ".env" });

export const PORT =  process.env.PORT!;
export const DB_NAME =  process.env.DB_NAME!;
export const JWT_SECRET =  process.env.JWT_SECRET!;
export const NODE_ENV =  process.env.NODE_ENV! || 'development';
export const MAIL_HOST = process.env.MAIL_HOST!;
export const MAIL_USERNAME = process.env.MAIL_USERNAME!;
export const MAIL_PASSWORD = process.env.MAIL_PASSWORD!;
export const MAIL_PORT = process.env.MAIL_PORT! || 587;
export const DEPOSIT_PERCENTAGE = process.env.DEPOSIT_PERCENTAGE! || 0.3;
export const FROM_EMAIL = process.env.FROM_EMAIL!;
export const ADMIN_DASH = process.env.ADMIN_DASH!;
export const APP_SECRET = process.env.APP_SECRET!;
export const CLOUDINARY_NAME = process.env.CLOUDINARY_NAME!;
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY!;
export const CLOUDINARY_SECRET = process.env.CLOUDINARY_SECRET!;
export const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER!;
export const GOOGLE_PROFILE = process.env.GOOGLE_PROFILE!;
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
export const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;
export const GOOGLE_LOGIN_FAILURE_REDIRECT = process.env.GOOGLE_LOGIN_FAILURE_REDIRECT!;
export const PUBLIC_URL = process.env.PUBLIC_URL!;
export const DATABASE_URL = process.env.DATABASE_URL!;
export const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!; 
export const PAYSTACK_WEBHOOK_SECRET_KEY = process.env.PAYSTACK_WEBHOOK_SECRET_KEY!;
export const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY!;
export const FLUTTERWAVE_SECRET_HASH=process.env.FLUTTERWAVE_SECRET_HASH!;
export const APP_URL= process.env.APP_URL!;
export const STRIPE_LINK= process.env.STRIPE_LINK!;
export const SEND_MAIL_API_KEY= process.env.SEND_MAIL_API_KEY!;
export const SEND_MAIL_SMS_PHONE= process.env.SEND_MAIL_SMS_PHONE!;
export const FRONT_END_URL= process.env.FRONT_END_URL!;
export const EXPIRES_IN_SHORT= process.env.EXPIRES_IN_SHORT!;
export const EXPIRES_IN_LONG= process.env.EXPIRES_IN_LONG!;
export const STRIPE_API_KEY = process.env.STRIPE_API_KEY!;
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;
export const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY!;
export const ENCRYPTION_ALGO = process.env.ENCRYPTION_ALGO!;
export const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET!;
export const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL! || 'localhost:3000/auth/google';
export const FRONTEND_URL = process.env.FRONTEND_URL! || 'localhost:3000/auth/google';
export const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID!
export const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID!
export const APPLE_PRIVATE_KEY = process.env.APPLE_PRIVATE_KEY!
export const APPLE_KEY_IDENTIFIER = process.env.APPLE_KEY_IDENTIFIER!
export const APPLE_REDIRECT_URI = process.env.APPLE_REDIRECT_URI!
export const AUTO_DEV_API_KEY = process.env.AUTO_DEV_API_KEY || '';
export const AUTO_DEV_BASE_URL = process.env.AUTO_DEV_BASE_URL || 'https://api.auto.dev';
export const TOKEN_EXPIRY_MINUTES = process.env.TOKEN_EXPIRY_MINUTES!;
export const REDIS_URL = process.env.REDIS_URL || '';
export const REDIS_CACHE_TTL_HOURS = process.env.REDIS_CACHE_TTL_HOURS || '12'; // Default 12 hours
export const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL
export const UPSTASH_REDIS_REST_TOKEN= process.env.UPSTASH_REDIS_REST_TOKEN
export const CORS_ORIGINS = process.env.CORS_ORIGINS!;
export const EXCHANGE_RATE_API_URL = process.env.EXCHANGE_RATE_API_URL!;
export const EXCHANGE_RATE_CACHE_TTL = process.env.EXCHANGE_RATE_CACHE_TTL!;


// # Cookie security
export const COOKIE_SECURE = process.env.COOKIE_SECURE!;
export const COOKIE_SAMESITE = process.env.COOKIE_SAMESITE!;
export const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN!;
// # Access token cookie
export const ACCESS_TOKEN_COOKIE_NAME = process.env.ACCESS_TOKEN_COOKIE_NAME!;
export const ACCESS_TOKEN_MAX_AGE = process.env.ACCESS_TOKEN_MAX_AGE!;

// Refresh token cookie
export const REFRESH_TOKEN_COOKIE_NAME = process.env.REFRESH_TOKEN_COOKIE_NAME!;
export const REFRESH_TOKEN_MAX_AGE = process.env.REFRESH_TOKEN_MAX_AGE!;
export const REFRESH_TOKEN_PATH = process.env.REFRESH_TOKEN_PATH!;
export const RESEND_API_KEY = process.env.RESEND_API_KEY!;
export const RESEND_EMAIL = process.env.RESEND_EMAIL!;
