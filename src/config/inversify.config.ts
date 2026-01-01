import { Container } from 'inversify';
import { TYPES } from './types';


// User dependencies
import { UserService } from '../services/UserService';
import { UserController } from '../controllers/UserController';
import { AuthController } from '../controllers/AuthController';
import { UserRepository } from '../repositories/UserRepository';
import { ProfileService } from '../services/ProfileService';
import TokenService from '../services/TokenService';
import { MailService } from '../services/MailService';
import {AppleAuthService} from '../services/AppleAuthService';
import { GoogleAuthService } from '../services/GoogleAuthService';
import Jtoken from '../middleware/Jtoken';



const container = new Container();


container.bind<UserRepository>(TYPES.UserRepository).to(UserRepository);
container.bind<UserService>(TYPES.UserService).to(UserService);
container.bind<AuthController>(TYPES.AuthController).to(AuthController);
container.bind<UserController>(TYPES.UserController).to(UserController);
container.bind<ProfileService>(TYPES.ProfileService).to(ProfileService);
// Bind services
container.bind<Jtoken>(TYPES.Jtoken).to(Jtoken);
container.bind<MailService>(TYPES.MailService).to(MailService);
container.bind<AppleAuthService>(TYPES.AppleAuthService).to(AppleAuthService);
container.bind<GoogleAuthService>(TYPES.GoogleAuthService).to(GoogleAuthService);
container.bind<TokenService>(TYPES.TokenService).to(TokenService);

export { container };