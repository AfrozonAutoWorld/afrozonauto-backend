import { inject, injectable } from 'inversify';
import { ProfileRepository } from '../repositories/ProfileRepository';
import { TYPES } from '../config/types';
import { Profile } from '../generated/prisma/client';

@injectable()
export class ProfileService {
  constructor(
    @inject(TYPES.ProfileRepository) private profileRepo: ProfileRepository
  ) {}

  create(data: Partial<Profile>, userId: string) {
    return this.profileRepo.create(data, userId);
  }

  findById(id: string) {
    return this.profileRepo.findById(id);
  }
  findUserById(userId: string) {
    return this.profileRepo.findUserById(userId);
  }

  update(id: string, data: Partial<Profile>) {
    return this.profileRepo.update(id, data);
  }
  updateProfileByUserId(id: string, data: Partial<Profile>) {
    return this.profileRepo.updateProfileByUserId(id, data);
  }

  delete(id: string) {
    return this.profileRepo.delete(id);
  }

  findAll() {
    return this.profileRepo.findAll();
  }
}
