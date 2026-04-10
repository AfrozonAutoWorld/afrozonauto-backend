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
        registerAs?: string;
        /** True when the user just completed the seller email OTP (proves inbox access). Allows aligning password with the form for accounts that already existed but were unverified. */
        verifiedViaSellerOtp?: boolean;
    }): Promise<{ user: User; profile: Profile }> {
        const existing = await this.userRepo.findByEmail(data.email);

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
            const imageName = f.imageName || f.originalName;
            if (imageName) fileData.imageName = imageName;
            const mappedDocName = mapDocumentName(f.documentName);
            if (mappedDocName) fileData.documentName = mappedDocName;
            return fileData;
        };

        if (existing) {
            // If user exists, we check if they already have a seller application
            const existingProfile = await this.profileRepo.findUserById(existing.id);
            if (existingProfile?.sellerStatus === SellerVerificationStatus.PENDING || existingProfile?.sellerStatus === SellerVerificationStatus.APPROVED) {
                throw ApiError.badRequest('This account is already a seller or has a pending application.');
            }

            if (!data.password?.trim()) {
                throw ApiError.badRequest('Password is required to confirm your existing account.');
            }
            if (!existing.passwordHash) {
                throw ApiError.badRequest(
                    'This email uses Google or Apple sign-in. Please log in that way, or set a password in your account settings before applying as a seller.',
                );
            }

            let passwordMatches = await bcrypt.compare(data.password, existing.passwordHash);
            // Email OTP already proved access; allow the password from this form to become the account password if it differed (e.g. unverified user chose a new strong password here).
            if (!passwordMatches && data.verifiedViaSellerOtp) {
                if (data.password.length < 6) {
                    throw ApiError.badRequest('Password must be at least 6 characters');
                }
                const newHash = await bcrypt.hash(data.password, 10);
                await prisma.user.update({
                    where: { id: existing.id },
                    data: { passwordHash: newHash },
                });
                passwordMatches = true;
            }
            if (!passwordMatches) {
                throw ApiError.badRequest('Incorrect password. Enter the password you use to sign in with this email.');
            }

            // Append role if registerAs is provided
            if (data.registerAs && !existing.roles?.includes(data.registerAs as UserRole)) {
                await prisma.user.update({
                    where: { id: existing.id },
                    data: {
                        roles: { push: data.registerAs as UserRole }
                    }
                });
            }

            // Update profile to include seller info and set status to PENDING
            const profile = await prisma.profile.update({
                where: { userId: existing.id },
                data: {
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
                                    .filter(f => f && f.url)
                                    .map(buildFileData)
                            }
                        }
                    })
                },
                include: { files: true }
            });

            const userAfter = await this.userRepo.findByEmail(data.email);
            if (!userAfter) {
                throw ApiError.internal('User not found after seller registration update');
            }

            // We don't update roles here, role is updated upon admin verification
            return { user: userAfter, profile };
        }

        if (!data.password || data.password.length < 6) {
            throw ApiError.badRequest('Password is required (min 6 characters) for new seller accounts');
        }

        const passwordHash = await bcrypt.hash(data.password, 10);
        const uniqueGoogleId = `local_${randomUUID()}`;
        const uniqueAppleId = `local_${randomUUID()}`;

        // Initial roles: start with BUYER, and add registerAs if provided
        const initialRoles: UserRole[] = [UserRole.BUYER];
        if (data.registerAs && data.registerAs !== UserRole.BUYER) {
            initialRoles.push(data.registerAs as UserRole);
        }

        // 1. Create User
        const user = await prisma.user.create({
            data: {
                email: data.email,
                passwordHash,
                phone: data.phone,
                roles: { set: initialRoles },
                emailVerified: true,
                googleId: uniqueGoogleId,
                appleId: uniqueAppleId,
            },
        });

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
                                .filter(f => f && f.url)
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
                isVerified: true,
                verifiedAt: new Date(),
            });

            // 2. Update User Roles
            await prisma.user.update({
                where: { id: profile.userId },
                data: {
                    roles: { push: UserRole.SELLER }
                }
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
