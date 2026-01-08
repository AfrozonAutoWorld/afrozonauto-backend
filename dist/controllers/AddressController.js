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
exports.AddressController = void 0;
const inversify_1 = require("inversify");
const types_1 = require("../config/types");
const AddressService_1 = require("../services/AddressService");
const client_1 = require("../generated/prisma/client");
const address_validation_1 = require("../validation/schema/address.validation");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
let AddressController = class AddressController {
    constructor(addressService) {
        this.addressService = addressService;
        this.createAddress = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            if (!req.user) {
                throw ApiError_1.ApiError.unauthorized('User not authenticated');
            }
            if (!req.user.profile) {
                throw ApiError_1.ApiError.badRequest('User profile not found');
            }
            const userId = req.user.id;
            const address = yield this.addressService.createAddress(req.user.profile.id, Object.assign(Object.assign({}, req.body), { userId }));
            res
                .status(201)
                .json(new ApiResponse_1.ApiResponse(201, address, 'Address created successfully'));
        }));
        this.getUserAddresses = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            if (!req.user) {
                throw ApiError_1.ApiError.unauthorized('User not authenticated');
            }
            const addresses = yield this.addressService.getUserAddresses(req.user.id);
            res.json(new ApiResponse_1.ApiResponse(200, addresses, 'User addresses retrieved successfully'));
        }));
        this.getDefaultAddress = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            // Validate query parameters
            if (!req.user) {
                throw ApiError_1.ApiError.unauthorized('User not authenticated');
            }
            const { error, value } = address_validation_1.createAddressSchema.validate(req.query);
            if (error) {
                return res.status(400).json(ApiError_1.ApiError.badRequest('Invalid query parameters', error.details.map(d => ({
                    field: d.path.join('.'),
                    message: d.message
                }))));
            }
            const type = value.type || client_1.AddressType.NORMAL;
            const address = yield this.addressService.getDefaultAddress(req.user.id, type);
            if (!address) {
                return res.status(404).json(ApiError_1.ApiError.notFound('Default address not found', {
                    requestedType: type,
                    suggestion: 'Try creating a default address first',
                    allowedTypes: Object.values(client_1.AddressType)
                }));
            }
            res.json(new ApiResponse_1.ApiResponse(200, address, 'Default address retrieved successfully'));
        }));
        this.updateAddress = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const address = yield this.addressService.updateAddress(req.params.id, req.body);
            if (!address) {
                return res.status(404).json(ApiError_1.ApiError.notFound('Address not found'));
            }
            res.json(new ApiResponse_1.ApiResponse(200, address, 'Address updated successfully'));
        }));
        this.deleteAddress = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const deleted = yield this.addressService.deleteAddress(req.params.id);
            if (!deleted) {
                return res.status(404).json(ApiError_1.ApiError.notFound('Address not found'));
            }
            res.json(new ApiResponse_1.ApiResponse(200, { deleted }, 'Address deleted successfully'));
        }));
    }
};
exports.AddressController = AddressController;
exports.AddressController = AddressController = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.AddressService)),
    __metadata("design:paramtypes", [AddressService_1.AddressService])
], AddressController);
