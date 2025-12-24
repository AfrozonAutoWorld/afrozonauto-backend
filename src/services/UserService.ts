import { injectable, inject } from 'inversify';
import { TYPES } from '../config/types';
import { UserRepository } from '../repositories/UserRepository';
import bcrypt from 'bcrypt';

@injectable()
export class UserService {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepository
  ) {}

  async createUser(data: {
    userID: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) {
    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.userRepository.create({
      ...data,
      password: hashedPassword,
    });
  }

  async getUserById(id: string) {
    return this.userRepository.findById(id);
  }

  async getUserByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  async getAllUsers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const users = await this.userRepository.findAll(skip, limit);
    const total = await this.userRepository.count();

    return {
      users,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async updateUser(id: string, data: Partial<any>) {
    return this.userRepository.update(id, data);
  }

  async deleteUser(id: string) {
    return this.userRepository.delete(id);
  }
}