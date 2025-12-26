import { inject, injectable } from 'inversify';
import { Address, AddressType } from '../generated/prisma/client';
import { TYPES } from '../config/types';
import { AddressRepository } from '../repositories/AddressRepository';
import { CreateAddressDto } from '../validation/dtos/address.dto';

@injectable()
export class AddressService {
  constructor(
    @inject(TYPES.AddressRepository)
    private readonly addressRepository: AddressRepository
  ) { }

  /**
   * Create a new address for a profile
   */
  async createAddress(
    profileId: string,
    addressData: CreateAddressDto
  ): Promise<Address> {
  
    const addressType = addressData.type ?? AddressType.NORMAL;
  
    if (addressData.isDefault) {
      await this.addressRepository.updateMany(
        {
          profileId,
          type: addressType,
        },
        {
          isDefault: false,
        }
      );
    }
  
    return this.addressRepository.create({
      profileId,
      type: addressType,
  
      street: addressData.street ?? null,
      firstName: addressData.firstName ?? null,
      lastName: addressData.lastName ?? null,
      city: addressData.city,
      state: addressData.state ?? null,
      postalCode: addressData.postalCode ?? null,
      country: addressData.country ?? null,
      isDefault: addressData.isDefault ?? false,
      additionalInfo: addressData.additionalInfo ?? null,
      phoneNumber: addressData.phoneNumber ?? null,
      additionalPhoneNumber: addressData.additionalPhoneNumber ?? null,
    });
  }
  
  /**
   * Get all addresses for a profile
   */
  async getProfileAddresses(profileId: string): Promise<Address[]> {
    return this.addressRepository.findByProfileId(profileId);
  }

  /**
   * Get default address by profile & type
   */
  async getDefaultAddress(
    profileId: string,
    type: AddressType
  ): Promise<Address | null> {
    return this.addressRepository.findDefaultByProfileId(profileId, type);
  }

  /**
   * Get single address by ID
   */
  async getAddressById(id: string): Promise<Address | null> {
    return this.addressRepository.findById(id);
  }

  /**
   * Update an address
   */
  async updateAddress(
    id: string,
    addressData: Partial<Omit<Address, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Address | null> {
    // Handle change to default
    if (addressData.isDefault) {
      const existing = await this.addressRepository.findById(id);
      if (!existing) return null;

      await this.addressRepository.updateMany(
        {
          profileId: existing.profileId,
          type: existing.type,
        },
        {
          isDefault: false,
        }
      );
    }

    return this.addressRepository.update(id, addressData);
  }

  /**
   * Delete address
   */
  async deleteAddress(id: string): Promise<boolean> {
    return this.addressRepository.delete(id);
  }
}
