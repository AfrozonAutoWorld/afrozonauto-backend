import { Container } from 'inversify';
import { TYPES } from './types';


// User dependencies
import { UserService } from '../services/UserService';
import { UserController } from '../controllers/UserController';
import { AuthController } from '../controllers/AuthController';
import { UserRepository } from '../repositories/UserRepository';



const container = new Container();


container.bind<UserRepository>(TYPES.UserRepository).to(UserRepository);
container.bind<UserService>(TYPES.UserService).to(UserService);
container.bind<AuthController>(TYPES.AuthController).to(AuthController);
container.bind<UserController>(TYPES.UserController).to(UserController);

export { container };