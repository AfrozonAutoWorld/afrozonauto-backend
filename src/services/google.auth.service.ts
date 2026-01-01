import passport from 'passport';
import {
  Strategy as GoogleStrategy,
  Profile as GoogleProfile,
} from "passport-google-oauth20";
import UserServices from './user.services';
import Jtoken from '../middlewares/Jtoken';
import { UserRole, JWTPayload } from '../utils/types';
import {GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL} from "../secrets"


export class GoogleAuthService {
  private tokenService: Jtoken;

  constructor() {
    this.tokenService = new Jtoken();
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
        const user = await UserServices.getUserById(id);
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    });
  }

  private async handleGoogleUser(profile: GoogleProfile) {
    const email = profile.emails[0].value;
    const googleId = profile.id;

    // Check if user exists with this Google ID
    let user = await UserServices.getUserByGoogleId(googleId);

    if (!user) {
      // Check if user exists with this email
      user = await UserServices.getUserByEmail(email);

      if (user) {
        // Link Google account to existing user
        user = await UserServices.updateUser(user._id.toString(), {
          googleId,
          emailVerified: true,
        });
      } else {
        // Create new user with Google account
        user = await UserServices.createUser({
          email,
          googleId,
          role: UserRole.USER,
          emailVerified: true,
          password: this.generateRandomPassword(), 
        }, {
          firstName: profile.name.givenName, 
          lastName: profile.name.familyName,
          image: profile.photos[0]?.value,
        });
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

export default new GoogleAuthService();