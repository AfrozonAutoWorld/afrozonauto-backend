"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SellerService = void 0;
const inversify_1 = require("inversify");
const bcrypt_1 = __importDefault(require("bcrypt"));
const node_crypto_1 = require("node:crypto");
const db_1 = __importDefault(require("../db"));
const types_1 = require("../config/types");
const ProfileRepository_1 = require("../repositories/ProfileRepository");
const UserRepository_1 = require("../repositories/UserRepository");
const client_1 = require("../generated/prisma/client");
const ApiError_1 = require("../utils/ApiError");
const TokenService_1 = __importDefault(require("./TokenService"));
let SellerService = class SellerService {
    constructor(profileRepo, userRepo, tokenService) {
        this.profileRepo = profileRepo;
        this.userRepo = userRepo;
        this.tokenService = tokenService;
    }
    /**
     * Register a new user as a seller (initial status: PENDING)
     */
    registerSeller(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const existing = yield this.userRepo.findByEmail(data.email);
            if (existing)
                throw ApiError_1.ApiError.badRequest('User already exists');
            const passwordHash = yield bcrypt_1.default.hash(data.password, 10);
            const uniqueGoogleId = `local_${(0, node_crypto_1.randomUUID)()}`;
            const uniqueAppleId = `local_${(0, node_crypto_1.randomUUID)()}`;
            // 1. Create User
            const user = yield db_1.default.user.create({
                data: {
                    email: data.email,
                    passwordHash,
                    phone: data.phone,
                    role: client_1.UserRole.SELLER,
                    emailVerified: true,
                    googleId: uniqueGoogleId,
                    appleId: uniqueAppleId,
                },
            });
            // Helper function to map document names
            const mapDocumentName = (name) => {
                if (!name)
                    return null;
                const upperName = name.toUpperCase().replace(/[\s_-]+/g, '_');
                const mapping = {
                    'NIN': client_1.DocumentName.NIN,
                    'NATIONAL_ID': client_1.DocumentName.NIN,
                    'VENDOR_NIN': client_1.DocumentName.vendorNIN,
                    'BVN': client_1.DocumentName.BVN,
                    'DRIVERS_LICENSE': client_1.DocumentName.driversLicense,
                    'PASSPORT': client_1.DocumentName.passport,
                    'VOTERS_CARD': client_1.DocumentName.votersCard,
                    'TAX_ID': client_1.DocumentName.taxId,
                    'BUSINESS_CERT': client_1.DocumentName.businessCertificate,
                    'BUSINESS_REGISTRATION': client_1.DocumentName.businessRegistration,
                    'CAC': client_1.DocumentName.cac,
                    'STORE_LOGO': client_1.DocumentName.storeLogo,
                    'PICTURE': client_1.DocumentName.picture,
                    'OTHER': client_1.DocumentName.others,
                };
                return mapping[upperName] || client_1.DocumentName.others;
            };
            const buildFileData = (f) => {
                const fileData = {
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
            const profile = yield db_1.default.profile.create({
                data: Object.assign({ userId: user.id, firstName: data.firstName, lastName: data.lastName, businessName: data.businessName, taxId: data.taxId, identificationNumber: data.identificationNumber, identificationType: data.identificationType, sellerStatus: client_1.SellerVerificationStatus.PENDING, isSeller: false }, (data.uploadedFiles && data.uploadedFiles.length > 0 && {
                    files: {
                        createMany: {
                            data: data.uploadedFiles
                                .filter(f => f && f.url) // Filter out invalid entries
                                .map(buildFileData)
                        }
                    }
                })),
                include: {
                    files: true
                }
            });
            return { user, profile };
        });
    }
    /**
     * Existing user applies to become a seller
     */
    applyAsSeller(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const profile = yield this.profileRepo.findUserById(userId);
            if (!profile)
                throw ApiError_1.ApiError.notFound('Profile not found');
            if (profile.sellerStatus === client_1.SellerVerificationStatus.PENDING) {
                throw ApiError_1.ApiError.badRequest('Application already pending');
            }
            // Update profile to PENDING and add/update business info
            return this.profileRepo.update(profile.id, {
                businessName: data.businessName,
                taxId: data.taxId,
                identificationNumber: data.identificationNumber,
                identificationType: data.identificationType,
                sellerStatus: client_1.SellerVerificationStatus.PENDING,
                // If adding new files
                files: data.uploadedFiles ? {
                    createMany: {
                        data: data.uploadedFiles.map(f => ({
                            url: f.url,
                            fileSize: f.fileSize || 0,
                            fileType: f.fileType || 'unknown',
                            format: f.format || 'unknown',
                            publicId: f.publicId || 'unknown',
                            documentName: f.documentName,
                        }))
                    }
                } : undefined
            });
        });
    }
    /**
     * Admin: List seller applications
     */
    getApplications() {
        return __awaiter(this, arguments, void 0, function* (status = client_1.SellerVerificationStatus.PENDING) {
            return db_1.default.profile.findMany({
                where: { sellerStatus: status },
                include: {
                    user: true,
                    files: true,
                },
                orderBy: { updatedAt: 'desc' }
            });
        });
    }
    /**
     * Admin: Verify/Reject seller application
     */
    verifySeller(profileId, approve, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            const profile = yield this.profileRepo.findById(profileId);
            if (!profile)
                throw ApiError_1.ApiError.notFound('Profile not found');
            if (approve) {
                // 1. Update Profile
                const updatedProfile = yield this.profileRepo.update(profileId, {
                    sellerStatus: client_1.SellerVerificationStatus.APPROVED,
                    isSeller: true,
                    sellerVerifiedAt: new Date(),
                    sellerRejectedReason: null,
                });
                // 2. Update User Role
                yield this.userRepo.update(profile.userId, {
                    role: client_1.UserRole.SELLER
                });
                return updatedProfile;
            }
            else {
                return this.profileRepo.update(profileId, {
                    sellerStatus: client_1.SellerVerificationStatus.REJECTED,
                    isSeller: false,
                    sellerRejectedReason: reason || 'Application did not meet requirements',
                });
            }
        });
    }
};
exports.SellerService = SellerService;
exports.SellerService = SellerService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.ProfileRepository)),
    __param(1, (0, inversify_1.inject)(types_1.TYPES.UserRepository)),
    __param(2, (0, inversify_1.inject)(types_1.TYPES.TokenService)),
    __metadata("design:paramtypes", [ProfileRepository_1.ProfileRepository,
        UserRepository_1.UserRepository,
        TokenService_1.default])
], SellerService);
