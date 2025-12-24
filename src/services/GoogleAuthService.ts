import passport from 'passport';
import {
  Strategy as GoogleStrategy,
  Profile as GoogleProfile,
} from "passport-google-oauth20";
import Jtoken from '../middleware/Jtoken';
import { inject, injectable } from 'inversify';
import {GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL} from "../secrets"
import { UserRole } from '../models/User';
import { JWTPayload } from "../types/customRequest";
import { TYPES } from '../config/types';
import { UserService } from './UserService';
import { Types } from 'mongoose';
import { IUserRepository } from '../interfaces/IUserRepository';
import loggers from '../utils/loggers';


@injectable()
export class GoogleAuthService {
  private tokenService: Jtoken;

  constructor(
    @inject(TYPES.UserService) private userServices: UserService,
    @inject(TYPES.IUserRepository) private userRepo: IUserRepository,
  ) {
    this.initializePassport();
    this.tokenService = new Jtoken();
  }

  private initializePassport() {
    passport.use(
      new GoogleStrategy(
        {
          clientID: GOOGLE_CLIENT_ID!,
          clientSecret: GOOGLE_CLIENT_SECRET!,
          callbackURL: GOOGLE_CALLBACK_URL!,
          scope: ['profile', 'email'],
          passReqToCallback: true, 
        },
        async (req: any, accessToken: string, refreshToken: string, profile: GoogleProfile, done: any) => {
          try {
            const user = await this.handleGoogleUser(profile);
            return done(null, user);
          } catch (error) {
            return done(error, null);
          }
        }
      )
    );

    // Serialize user for session
    passport.serializeUser((user: any, done) => {
      done(null, user._id);
    });

    // Deserialize user from session
    passport.deserializeUser(async (id: string, done) => {
      try {
        const user = await this.userServices.findById(new Types.ObjectId(id));
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    });
  }

  private async handleGoogleUser(profile: GoogleProfile) {
    const email = profile.emails[0].value;
    const googleId = profile.id;

    loggers.info(profile)
  
    let user = await this.userServices.getUserByGoogleId(googleId);
    if (!user) {
      user = await this.userServices.getUserByEmail(email);
  
      if (user) {
        // Link Google account
        user = await this.userServices.updateUserInfo(user._id, {
          googleId,
          verified: true,
        });
  
      } else {
        const googlePhoto = {
          url: profile.photos[0]?.value || "",
          fileSize: 0,
          fileType: "image",
          format: "jpeg",
          publicId: googleId,
          imageName: "google-profile-photo",
          documentName: "storeLogo"
        };
  
        // Create new user
        user = await this.userRepo.createUser(
          {
            email,
            googleId,
            role: UserRole.CUSTOMER,
            verified: true,
            password: this.generateRandomPassword(),
          },
          {
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            photo: [googlePhoto],
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
      _id: user._id.toString(),
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