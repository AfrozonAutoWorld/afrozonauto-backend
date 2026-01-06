import passport from 'passport';
import {
  Strategy as GoogleStrategy,
  Profile as GoogleProfile,
} from "passport-google-oauth20";
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types';
import Jtoken from '../middleware/Jtoken';
import { JWTPayload } from "../types/customRequest";
import {GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL} from "../secrets"
import { UserRole } from '../generated/prisma/enums';
import { UserService } from './UserService';
import { container } from '../config/inversify.config';


@injectable()
export class GoogleAuthService {
 

  constructor(
    @inject(TYPES.UserRepository) private userService: UserService
  ) {
    this.initializePassport();
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
        const user = await this.userService.getUserById(id);
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    });
  }

  private async handleGoogleUser(profile: GoogleProfile) {
    const email = profile.emails?.[0]?.value;
  
    if (!email) {
      throw new Error('Google account does not provide an email address');
    }
  
    const googleId = profile.id;
  
    // Check if user exists with this Google ID
    let user = await this.userService.getUserByGoogleId(googleId);
  
    if (!user) {
      // Check if user exists with this email
      user = await this.userService.getUserByEmail(email);
  
      if (user) {
        // Link Google account
        user = await this.userService.updateUser(user.id.toString(), {
          googleId,
          emailVerified: true,
        });
      } else {
        // Create new user
        user = await this.userService.createUser(
          {
            email,
            googleId,
            role: UserRole.BUYER,
            emailVerified: true,
            password: this.generateRandomPassword(),
            firstName: profile.name?.givenName ?? undefined,
            lastName: profile.name?.familyName ?? undefined,
          },
          // {
           
          //   image: profile.photos?.[0]?.value ?? null,
          // }
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
      id: user._id.toString(),
      role: user.role,
      email: user.email,
    };
    const jtoken = container.get<Jtoken>(TYPES.Jtoken);
    return await jtoken.createShortLivedToken(payload);
  }

  getPassportMiddleware() {
    return passport.initialize();
  }

  getSessionMiddleware() {
    return passport.session();
  }
}