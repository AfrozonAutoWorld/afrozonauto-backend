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



const container = new Container();


container.bind<UserRepository>(TYPES.UserRepository).to(UserRepository);
container.bind<UserService>(TYPES.UserService).to(UserService);
container.bind<AuthController>(TYPES.AuthController).to(AuthController);
container.bind<UserController>(TYPES.UserController).to(UserController);
container.bind<ProfileService>(TYPES.ProfileService).to(ProfileService);

container.bind<MailService>(TYPES.MailService).to(MailService);
container.bind<TokenService>(TYPES.TokenService).to(TokenService);

export { container };