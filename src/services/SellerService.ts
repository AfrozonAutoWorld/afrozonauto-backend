import { inject, injectable } from 'inversify';
import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import prisma from '../db';
import { TYPES } from '../config/types';
import { ProfileRepository } from '../repositories/ProfileRepository';
import { UserRepository } from '../repositories/UserRepository';
import { SellerVerificationStatus, UserRole, User, Profile, DocumentName } from '../generated/prisma/client';
import { ApiError } from '../utils/ApiError';
import TokenService from './TokenService';

@injectable()
export class SellerService {
    constructor(
        @inject(TYPES.ProfileRepository) private profileRepo: ProfileRepository,
        @inject(TYPES.UserRepository) private userRepo: UserRepository,
        @inject(TYPES.TokenService) private tokenService: TokenService
    ) { }


/**
 * Register a new user as a seller (initial status: PENDING)
 */
async registerSeller(data: {
    email: string;
    password: string;
    phone?: string;
    firstName: string;
    lastName: string;
    businessName?: string;
    taxId?: string;
    identificationNumber?: string;
    identificationType?: string;
    uploadedFiles?: any[];
}): Promise<{ user: User; profile: Profile }> {
    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) throw ApiError.badRequest('User already exists');

    const passwordHash = await bcrypt.hash(data.password, 10);
    const uniqueGoogleId = `local_${randomUUID()}`;
    const uniqueAppleId = `local_${randomUUID()}`;

    // 1. Create User
    const user = await prisma.user.create({
        data: {
            email: data.email,
            passwordHash,
            phone: data.phone,
            role: UserRole.SELLER,
            emailVerified: true,
            googleId: uniqueGoogleId,
            appleId: uniqueAppleId,
        },
    });

    // Helper function to map document names
    const mapDocumentName = (name: string | null | undefined): DocumentName | null => {
        if (!name) return null;
        
        const upperName = name.toUpperCase().replace(/[\s_-]+/g, '_');
        
        const mapping: Record<string, DocumentName> = {
            'NIN': DocumentName.NIN,
            'NATIONAL_ID': DocumentName.NIN,
            'VENDOR_NIN': DocumentName.vendorNIN,
            'BVN': DocumentName.BVN,
            'DRIVERS_LICENSE': DocumentName.driversLicense,
            'PASSPORT': DocumentName.passport,
            'VOTERS_CARD': DocumentName.votersCard,
            'TAX_ID': DocumentName.taxId,
            'BUSINESS_CERT': DocumentName.businessCertificate,
            'BUSINESS_REGISTRATION': DocumentName.businessRegistration,
            'CAC': DocumentName.cac,
            'STORE_LOGO': DocumentName.storeLogo,
            'PICTURE': DocumentName.picture,
            'OTHER': DocumentName.others,
        };

        return mapping[upperName] || DocumentName.others;
    };

    // Helper to build file data object
    interface FileCreateInput {
        url: string;
        fileSize: number;
        fileType: string;
        format: string;
        publicId: string;
        imageName?: string;
        documentName?: DocumentName;
    }

    const buildFileData = (f: any): FileCreateInput => {
        const fileData: FileCreateInput = {
            url: f.url,
            fileSize: f.fileSize || 0,
            fileType: f.fileType || 'unknown',
            format: f.format || 'unknown',
            publicId: f.publicId || '',
        };

        // Add imageName if available (NOT originalName)
        const imageName = f.imageName || f.originalName;
        if (imageName) {
            fileData.imageName = imageName;
        }

        // Map and add documentName if available
        const mappedDocName = mapDocumentName(f.documentName);
        if (mappedDocName) {
            fileData.documentName = mappedDocName;
        }

        return fileData;
    };

    // 2. Create Profile with Seller fields
    const profile = await prisma.profile.create({
        data: {
            userId: user.id,
            firstName: data.firstName,
            lastName: data.lastName,
            businessName: data.businessName,
            taxId: data.taxId,
            identificationNumber: data.identificationNumber,
            identificationType: data.identificationType,
            sellerStatus: SellerVerificationStatus.PENDING,
            isSeller: false,
            ...(data.uploadedFiles && data.uploadedFiles.length > 0 && {
                files: {
                    createMany: {
                        data: data.uploadedFiles
                            .filter(f => f && f.url) // Filter out invalid entries
                            .map(buildFileData)
                    }
                }
            })
        },
        include: {
            files: true
        }
    });

    return { user, profile };
}

    /**
     * Existing user applies to become a seller
     */
    async applyAsSeller(userId: string, data: {
        businessName?: string;
        taxId?: string;
        identificationNumber?: string;
        identificationType?: string;
        uploadedFiles?: any[];
    }): Promise<Profile> {
        const profile = await this.profileRepo.findUserById(userId);
        if (!profile) throw ApiError.notFound('Profile not found');

        if (profile.sellerStatus === SellerVerificationStatus.PENDING) {
            throw ApiError.badRequest('Application already pending');
        }

        // Update profile to PENDING and add/update business info
        return this.profileRepo.update(profile.id, {
            businessName: data.businessName,
            taxId: data.taxId,
            identificationNumber: data.identificationNumber,
            identificationType: data.identificationType,
            sellerStatus: SellerVerificationStatus.PENDING,
            // If adding new files
            files: data.uploadedFiles ? {
                createMany: {
                    data: data.uploadedFiles.map(f => ({
                        url: f.url,
                        fileSize: f.fileSize || 0,
                        fileType: f.fileType || 'unknown',
                        format: f.format || 'unknown',
                        publicId: f.publicId || 'unknown',
                        documentName: f.documentName as DocumentName,
                    }))
                }
            } : undefined
        } as any);
    }

    /**
     * Admin: List seller applications
     */
    async getApplications(status: SellerVerificationStatus = SellerVerificationStatus.PENDING) {
        return prisma.profile.findMany({
            where: { sellerStatus: status },
            include: {
                user: true,
                files: true,
            },
            orderBy: { updatedAt: 'desc' }
        });
    }

    /**
     * Admin: Verify/Reject seller application
     */
    async verifySeller(profileId: string, approve: boolean, reason?: string): Promise<Profile> {
        const profile = await this.profileRepo.findById(profileId);
        if (!profile) throw ApiError.notFound('Profile not found');

        if (approve) {
            // 1. Update Profile
            const updatedProfile = await this.profileRepo.update(profileId, {
                sellerStatus: SellerVerificationStatus.APPROVED,
                isSeller: true,
                sellerVerifiedAt: new Date(),
                sellerRejectedReason: null,
            });

            // 2. Update User Role
            await this.userRepo.update(profile.userId, {
                role: UserRole.SELLER
            });

            return updatedProfile;
        } else {
            return this.profileRepo.update(profileId, {
                sellerStatus: SellerVerificationStatus.REJECTED,
                isSeller: false,
                sellerRejectedReason: reason || 'Application did not meet requirements',
            });
        }
    }
}
