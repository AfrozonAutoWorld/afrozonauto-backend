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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressService = void 0;
const inversify_1 = require("inversify");
const client_1 = require("../generated/prisma/client");
const types_1 = require("../config/types");
const AddressRepository_1 = require("../repositories/AddressRepository");
let AddressService = class AddressService {
    constructor(addressRepository) {
        this.addressRepository = addressRepository;
    }
    /**
     * Create a new address for a profile
     */
    createAddress(profileId, addressData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
            const addressType = (_a = addressData.type) !== null && _a !== void 0 ? _a : client_1.AddressType.NORMAL;
            if (addressData.isDefault) {
                yield this.addressRepository.updateMany({
                    profileId,
                    type: addressType,
                }, {
                    isDefault: false,
                });
            }
            return this.addressRepository.create({
                profileId,
                type: addressType,
                street: (_b = addressData.street) !== null && _b !== void 0 ? _b : null,
                firstName: (_c = addressData.firstName) !== null && _c !== void 0 ? _c : null,
                lastName: (_d = addressData.lastName) !== null && _d !== void 0 ? _d : null,
                city: addressData.city,
                state: (_e = addressData.state) !== null && _e !== void 0 ? _e : null,
                postalCode: (_f = addressData.postalCode) !== null && _f !== void 0 ? _f : null,
                country: (_g = addressData.country) !== null && _g !== void 0 ? _g : null,
                isDefault: (_h = addressData.isDefault) !== null && _h !== void 0 ? _h : false,
                additionalInfo: (_j = addressData.additionalInfo) !== null && _j !== void 0 ? _j : null,
                phoneNumber: (_k = addressData.phoneNumber) !== null && _k !== void 0 ? _k : null,
                additionalPhoneNumber: (_l = addressData.additionalPhoneNumber) !== null && _l !== void 0 ? _l : null,
            });
        });
    }
    /**
     * Get all addresses for a profile
     */
    getProfileAddresses(profileId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.addressRepository.findByProfileId(profileId);
        });
    }
    /**
     * Get default address by profile & type
     */
    getDefaultAddress(profileId, type) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.addressRepository.findDefaultByProfileId(profileId, type);
        });
    }
    /**
     * Get single address by ID
     */
    getAddressById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.addressRepository.findById(id);
        });
    }
    /**
     * Update an address
     */
    updateAddress(id, addressData) {
        return __awaiter(this, void 0, void 0, function* () {
            // Handle change to default
            if (addressData.isDefault) {
                const existing = yield this.addressRepository.findById(id);
                if (!existing)
                    return null;
                yield this.addressRepository.updateMany({
                    profileId: existing.profileId,
                    type: existing.type,
                }, {
                    isDefault: false,
                });
            }
            return this.addressRepository.update(id, addressData);
        });
    }
    /**
     * get all user address
     */
    getUserAddresses(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.addressRepository.findByProfileId(id);
        });
    }
    /**
     * Delete address
     */
    deleteAddress(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.addressRepository.delete(id);
        });
    }
};
exports.AddressService = AddressService;
exports.AddressService = AddressService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.AddressRepository)),
    __metadata("design:paramtypes", [AddressRepository_1.AddressRepository])
], AddressService);
