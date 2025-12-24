import { inject, injectable } from 'inversify';
import { AddressType, IAddress } from '@prisma/client';
import { TYPES } from '../config/types';
import { AddressRepository } from '../repositories/AddressRepository';
import { Types } from 'mongoose';


@injectable()
export class AddressService   {
  constructor(
    @inject(TYPES.AddressRepository) private addressRepository: AddressRepository
  ) {}
  async createAddress(addressData: IAddress): Promise<IAddress> {
    // If setting as default, ensure no other defaults exist for this type
    if (addressData.isDefault) {
      await this.addressRepository.updateMany(
        { 
          userId: new Types.ObjectId(addressData.userId), 
          type: addressData.type 
        },
        { $set: { isDefault: false } }
      );
    }
    return this.addressRepository.create(addressData);
  }

  async getUserAddresses(userId: string): Promise<IAddress[]> {
    return this.addressRepository.findByUserId(userId);
  }

  async getDefaultAddress(userId: string, type: AddressType): Promise<IAddress | null> {
    return this.addressRepository.findDefaultByUserId(userId, type);
  }

  async updateAddress(id: string, addressData: Partial<IAddress>): Promise<IAddress | null> {
    // Handle default address change
    if (addressData.isDefault) {
      const existingAddress = await this.addressRepository.findById(id);
      if (existingAddress) {
        await this.addressRepository.updateMany(
          { 
            userId: existingAddress.userId, 
            type: existingAddress.type, 
            _id: { $ne: new Types.ObjectId(id) } 
          },
          { $set: { isDefault: false } }
        );
      }
    }
    return this.addressRepository.findByIdAndUpdate(
      id,
      { $set: addressData },
      { new: true }
    );
  }

  async deleteAddress(id: string): Promise<boolean> {
    return this.addressRepository.delete(id);
  }
  async getAddressById(id: string) {
    return await this.addressRepository.findById(id);
  }
}