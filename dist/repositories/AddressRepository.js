"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
exports.AddressRepository = void 0;
const inversify_1 = require("inversify");
const db_1 = __importDefault(require("../db"));
let AddressRepository = class AddressRepository {
    // Create a new address
    create(address) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.address.create({
                data: Object.assign({}, address),
            });
        });
    }
    // Find all addresses for a profile (userId through profileId)
    findByProfileId(profileId) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.address.findMany({
                where: { profileId },
                orderBy: [
                    { isDefault: 'desc' },
                    { createdAt: 'desc' }
                ],
            });
        });
    }
    // Find address by ID
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.address.findUnique({
                where: { id },
            });
        });
    }
    // Update many addresses (useful for resetting defaults)
    updateMany(filter, update) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db_1.default.address.updateMany({
                where: filter,
                data: update,
            });
        });
    }
    // Find default address by profileId and type
    findDefaultByProfileId(profileId, type) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.address.findFirst({
                where: { profileId, type, isDefault: true },
            });
        });
    }
    // Update an address by ID
    update(id, address) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.address.update({
                where: { id },
                data: address,
            });
        });
    }
    // Delete an address by ID
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const deleted = yield db_1.default.address.delete({
                where: { id },
            });
            return !!deleted;
        });
    }
};
exports.AddressRepository = AddressRepository;
exports.AddressRepository = AddressRepository = __decorate([
    (0, inversify_1.injectable)()
], AddressRepository);
