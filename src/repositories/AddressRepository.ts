import { injectable } from 'inversify';
import prisma from '../db';
import { Address, AddressType } from '@prisma/client';


@injectable()
export class AddressRepository {

  // Create a new address
  async create(address: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>): Promise<Address> {
    return prisma.address.create({
      data: {
        ...address,
      },
    });
  }

  // Find all addresses for a profile (userId through profileId)
  async findByProfileId(profileId: string): Promise<Address[]> {
    return prisma.address.findMany({
      where: { profileId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ],
    });
  }

  // Find address by ID
  async findById(id: string): Promise<Address | null> {
    return prisma.address.findUnique({
      where: { id },
    });
  }

  // Update many addresses (useful for resetting defaults)
  async updateMany(filter: Partial<Address>, update: Partial<Address>): Promise<void> {
    await prisma.address.updateMany({
      where: filter,
      data: update,
    });
  }

  // Find default address by profileId and type
  async findDefaultByProfileId(profileId: string, type: AddressType): Promise<Address | null> {
    return prisma.address.findFirst({
      where: { profileId, type, isDefault: true },
    });
  }

  // Update an address by ID
  async update(id: string, address: Partial<Omit<Address, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Address | null> {
    return prisma.address.update({
      where: { id },
      data: address,
    });
  }

  // Delete an address by ID
  async delete(id: string): Promise<boolean> {
    const deleted = await prisma.address.delete({
      where: { id },
    });
    return !!deleted;
  }
}
