import jwt, { SignOptions, Secret } from "jsonwebtoken";
import { JWTPayload } from "../types/customRequest";
import { JWT_SECRET, EXPIRES_IN_SHORT, EXPIRES_IN_LONG } from "../secrets";
import { UserRepository } from "../repositories/UserRepository";
import { ApiError } from "../utils/ApiError";
import { injectable, inject } from "inversify";
import { TYPES } from "../config/types";

const SHORT_EXPIRES_IN = "2m";

/**
 * Valid time units for JWT token expiration
 * @typedef {'ms'|'s'|'m'|'h'|'d'|'y'} ValidTimeUnit
 * - ms: milliseconds
 * - s: seconds
 * - m: minutes
 * - h: hours
 * - d: days
 * - y: years
 */
type ValidTimeUnit = 'ms' | 's' | 'm' | 'h' | 'd' | 'y';

/**
 * Valid JWT expiration formats
 * @typedef {number | `${number} ${ValidTimeUnit}`} JwtExpiresIn
 * Can be either:
 * - number (interpreted as seconds)
 * - string with value and unit (e.g., "2 days")
 */
type JwtExpiresIn = number | `${number} ${ValidTimeUnit}`;

/**
 * JWT Token Service
 * @class Jtoken
 * @description Handles all JWT token operations including generation, verification, and refreshing
 * 
 * @property {Secret} secret - JWT secret key from environment variables
 * @property {JwtExpiresIn} accessTokenExpiresIn - Expiration time for access tokens
 * @property {JwtExpiresIn} refreshTokenExpiresIn - Expiration time for refresh tokens
 */
@injectable()
export default class Jtoken {
    private readonly secret: Secret;
    private readonly accessTokenExpiresIn: JwtExpiresIn;
    private readonly refreshTokenExpiresIn: JwtExpiresIn;

    /**
     * @constructor
     * @param {UserRepository} userRepository - Injected user repository instance
     * @throws {Error} If required environment variables are missing
     * @description Initializes JWT service with configuration from environment variables
     */
    constructor(
        @inject(TYPES.UserRepository) private userRepository: UserRepository
        
    ) {
        if (!JWT_SECRET) throw new Error("JWT_SECRET environment variable is not set");
        if (!EXPIRES_IN_SHORT) throw new Error("EXPIRES_IN_SHORT environment variable is not set");
        if (!EXPIRES_IN_LONG) throw new Error("EXPIRES_IN_LONG environment variable is not set");

        this.secret = JWT_SECRET;
        this.accessTokenExpiresIn = this.parseExpiration(EXPIRES_IN_SHORT);
        this.refreshTokenExpiresIn = this.parseExpiration(EXPIRES_IN_LONG);
    }

    /**
     * Parses expiration time into valid JWT format
     * @private
     * @param {string|number} expiration - The expiration time to parse
     * @returns {JwtExpiresIn} Properly formatted expiration time
     * @throws {Error} If expiration format is invalid
     * 
     * @example
     * parseExpiration(3600) // returns 3600 (seconds)
     * parseExpiration("1 h") // returns "1 h"
     * parseExpiration("invalid") // throws Error
     */
    private parseExpiration(expiration: string | number): JwtExpiresIn {
        if (typeof expiration === 'number') return expiration;
        
        // Check for valid string format (e.g., "2 days")
        const parts = expiration.toString().split(/\s+/);
        if (parts.length !== 2) {
            throw ApiError.internal(`Invalid expiration format: ${expiration}. Expected format like "2 days"`);
        }

        const value = parseInt(parts[0]);
        if (isNaN(value)) {
            throw ApiError.internal(`Invalid number in expiration: ${expiration}`);
        }

        const unit = parts[1].toLowerCase();
        if (!['ms', 's', 'm', 'h', 'd', 'y'].includes(unit)) {
            throw ApiError.internal(`Invalid time unit in expiration: ${expiration}. Valid units: ms, s, m, h, d, y`);
        }

        return `${value} ${unit}` as JwtExpiresIn;
    }

    /**
     * Generates new JWT token pair (access + refresh)
     * @async
     * @param {JWTPayload} payload - The payload to include in tokens
     * @returns {Promise<{accessToken: string, refreshToken: string}>} Token pair
     * @throws {Error} If token generation fails
     * 
     * @example
     * await createToken({ id: "123", role: "BUYER", email: "user@example.com" })
     * // returns { accessToken: "xxx", refreshToken: "yyy" }
     */
    async createToken(payload: JWTPayload): Promise<{ accessToken: string; refreshToken: string }> {
        const accessTokenOptions: SignOptions = { expiresIn: this.accessTokenExpiresIn };
        const refreshTokenOptions: SignOptions = { expiresIn: this.refreshTokenExpiresIn };

        try {
            const [accessToken, refreshToken] = await Promise.all([
                this.signToken(payload, accessTokenOptions),
                this.signToken(payload, refreshTokenOptions)
            ]);

            return { 
                accessToken: accessToken as string, 
                refreshToken: refreshToken as string 
            };
        } catch (error) {
            throw ApiError.internal("Failed to generate authentication tokens");
        }
    }

    /**
     * Signs a JWT token with given payload and options
     * @private
     * @async
     * @param {string|object|Buffer} payload - Data to include in token
     * @param {SignOptions} options - Signing options
     * @returns {Promise<string>} Signed JWT token
     * @throws {Error} If signing fails
     */
    private signToken(payload: string | object | Buffer, options: SignOptions): Promise<string> {
        return new Promise((resolve, reject) => {
            jwt.sign(
                payload, 
                this.secret, 
                options, 
                (err: Error | null, token: string | undefined) => {
                    if (err || !token) {
                        reject(ApiError.internal("Token generation failed", { originalError: err?.message }));
                        return;
                    }
                    resolve(token);
                }
            );
        });
    }

    /**
     * Verifies and decodes a JWT token
     * @async
     * @param {string} token - JWT token to verify
     * @returns {Promise<JWTPayload|null>} Decoded payload if valid, null otherwise
     * 
     * @example
     * await verifyToken("xxx.yyy.zzz")
     * // returns { id: "123", role: "BUYER", email: "user@example.com", ... } or null if invalid
     */
    async verifyToken(token: string): Promise<JWTPayload | null> {
        return new Promise((resolve) => {
            jwt.verify(
                token, 
                this.secret, 
                (err: jwt.VerifyErrors | null, decoded: unknown) => {
                    if (err) {
                        console.error("Token verification failed:", err);
                        return resolve(null);
                    }
                    resolve(decoded as JWTPayload);
                }
            );
        });
    }

    /**
     * Refreshes an access token using a valid refresh token
     * @async
     * @param {string} refreshToken - Valid refresh token
     * @returns {Promise<{accessToken: string, refreshToken: string, user: Omit<User, 'passwordHash'>}|null>} 
     *          New token pair with user data or null if refresh fails
     * 
     * @example
     * await refreshAccessToken("refresh.xxx.yyy")
     * // returns { accessToken: "new.xxx", refreshToken: "new.yyy", user: { ... } }
     */
    async refreshAccessToken(refreshToken: string) {
        const decoded = await this.verifyToken(refreshToken);
        if (!decoded) {
            throw ApiError.unauthorized("Invalid refresh token");
        }

        const user = await this.userRepository.findById(decoded.id);
        if (!user) {
            throw ApiError.unauthorized("User not found");
        }

        try {
            const { passwordHash, ...userData } = user;
            const payload: JWTPayload = {
                id: user.id,
                role: user.role,
                email: user.email
            };

            const { accessToken, refreshToken: newRefreshToken } = await this.createToken(payload);
            return {
                accessToken,
                refreshToken: newRefreshToken,
                user: userData
            };
        } catch (error) {
            throw ApiError.unauthorized("Session expired. Please log in again.");
        }
    }

    /**
     * Creates a short-lived token for temporary operations
     * @async
     * @param {JWTPayload} payload - The payload to include in token
     * @returns {Promise<string>} Short-lived JWT token
     * 
     * @example
     * await createShortLivedToken({ id: "123", role: "BUYER", email: "user@example.com" })
     * // returns "xxx.yyy.zzz" (expires in 2 minutes)
     */
    createShortLivedToken = async (payload: JWTPayload): Promise<string> => {
        return jwt.sign(payload, this.secret, { expiresIn: SHORT_EXPIRES_IN });
    };
}