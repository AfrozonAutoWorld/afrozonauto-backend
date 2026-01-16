import passport from 'passport';
import {
  Strategy as GoogleStrategy,
  Profile as GoogleProfile,
  VerifyCallback
} from "passport-google-oauth20";

import Jtoken from '../middleware/Jtoken';
import { inject, injectable } from 'inversify';
import {GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL} from "../secrets"

import { JWTPayload } from "../types/customRequest";
import { TYPES } from '../config/types';
import { UserService } from './UserService';
import loggers from '../utils/loggers';
import { UserRepository } from '../repositories/UserRepository';
import { UserRole } from '../generated/prisma/enums';
import { ApiError } from '../utils/ApiError';
import { Prisma } from '../generated/prisma/client';


@injectable()
export class GoogleAuthService {
  private tokenService: Jtoken;

  constructor(
    @inject(TYPES.UserService) private userServices: UserService,
    @inject(TYPES.UserRepository) private userRepo: UserRepository,
    @inject(TYPES.Jtoken) private jtoken: Jtoken,
  ) {
    // Only initialize Passport if Google OAuth is configured
    if (this.isConfigured()) {
    this.initializePassport();
    } else {
      loggers.warn('Google authentication environment variables are missing. Google Sign-In will be disabled.');
    }
    this.tokenService = jtoken;
  }

  /**
   * Check if Google auth is configured
   */
  private isConfigured(): boolean {
    return !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_CALLBACK_URL);
  }

  private initializePassport() {
    if (!this.isConfigured()) {
      loggers.warn('Cannot initialize Google OAuth - missing configuration');
      return;
    }

    passport.use(
      new GoogleStrategy(
        {
          clientID: GOOGLE_CLIENT_ID!,
          clientSecret: GOOGLE_CLIENT_SECRET!,
          callbackURL: GOOGLE_CALLBACK_URL!,
          scope: ['profile', 'email'],
          passReqToCallback: true, 
        },
        async (req: any, accessToken: string, refreshToken: string, profile: GoogleProfile,    done: VerifyCallback) => {
          try {
            const user = await this.handleGoogleUser(profile);
            if (!user) {
              return done(null, false);
            }
            return done(null, user);
          } catch (error) {
            return done(error, undefined);
          }
        }
      )
    );

    // Serialize user for session
    passport.serializeUser((user: any,   done: VerifyCallback) => {
      done(null, user._id);
    });

    // Deserialize user from session
    passport.deserializeUser(async (id: string,    done: VerifyCallback) => {
      try {
        const user = await this.userServices.findById(id);
        if (!user) {
          return done(null, false);
        }
        done(null, user);
      } catch (error) {
        done(error, undefined);
      }
    });
  }

  private async handleGoogleUser(profile: GoogleProfile): Promise<any> {
    let email: string | null = null;
  
    if (profile.emails && profile.emails.length > 0) {
      email = profile.emails[0].value;
    }
  
    if (!email) {
      throw ApiError.badRequest("Email not found linked");
    }
  
    const googleId = profile.id;
  
    let user: any = await this.userServices.getUserByGoogleId(googleId);
  
    if (!user) {
      user = await this.userServices.getUserByEmail(email);
  
      if (user) {
        // Link Google account
        user = await this.userServices.updateUserInfo(user.id, {
          googleId,
          verified: true,
        });
      } else {
        const firstName = profile.name?.givenName ?? "";
        const lastName = profile.name?.familyName ?? "";
  
        const googlePhoto: Prisma.FileInfoCreateWithoutProfileInput = {
          url: profile.photos?.[0]?.value ?? "",
          fileSize: 0,
          fileType: "image",
          format: "jpeg",
          publicId: googleId,
          imageName: "google-profile-photo",
          documentName: "storeLogo",
        };
        
        user = await this.userRepo.createUser(
          {
            email,
            googleId,
            role: UserRole.BUYER,
            verified: true,
            password: this.generateRandomPassword(),
          },
          {
            firstName,
            lastName,
            photo: [googlePhoto]
          }
        );
        
      }
    }
  
    return user;
  }
  
  

  private generateRandomPassword(): string {
    return Math.random().toString(36).slice(-16) + Math.random().toString(36).slice(-16);
  }

  async generateTokens(user: any): Promise<string> {
    const payload: JWTPayload = {
      id: user.id.toString(),
      role: user.role,
      email: user.email,
    };

    return await this.tokenService.createShortLivedToken(payload);
  }

  getPassportMiddleware() {
    return passport.initialize();
  }

  getSessionMiddleware() {
    return passport.session();
  }
}