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
exports.SourcingRequestService = void 0;
const inversify_1 = require("inversify");
const SourcingRequestRepository_1 = require("../repositories/SourcingRequestRepository");
const types_1 = require("../config/types");
const ApiError_1 = require("../utils/ApiError");
const client_1 = require("../generated/prisma/client");
function parseYear(value) {
    if (!value || value.trim() === '' || value.toLowerCase() === 'any')
        return null;
    const n = parseInt(value, 10);
    return Number.isNaN(n) ? null : n;
}
let SourcingRequestService = class SourcingRequestService {
    constructor(repo) {
        this.repo = repo;
    }
    create(dto, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            const requestNumber = this.generateRequestNumber();
            const yearFrom = parseYear(dto.yearFrom);
            const yearTo = parseYear(dto.yearTo);
            const record = yield this.repo.create(Object.assign(Object.assign({ requestNumber, status: client_1.SourcingRequestStatus.NEW }, (userId && { user: { connect: { id: userId } } })), { make: dto.make.trim(), model: dto.model.trim(), yearFrom: yearFrom !== null && yearFrom !== void 0 ? yearFrom : undefined, yearTo: yearTo !== null && yearTo !== void 0 ? yearTo : undefined, trim: ((_a = dto.trim) === null || _a === void 0 ? void 0 : _a.trim()) || undefined, condition: dto.condition.toUpperCase(), budgetUsd: ((_b = dto.budgetUsd) === null || _b === void 0 ? void 0 : _b.trim()) || undefined, exteriorColor: ((_c = dto.exteriorColor) === null || _c === void 0 ? void 0 : _c.trim()) || undefined, anyColor: dto.anyColor, shippingMethod: dto.shipping.toLowerCase() === 'container' ? client_1.ShippingMethod.CONTAINER : client_1.ShippingMethod.RORO, timeline: dto.timeline.trim(), firstName: dto.firstName.trim(), lastName: dto.lastName.trim(), email: dto.email.trim().toLowerCase(), phoneCode: (dto.phoneCountryCode || '+234').trim(), phoneNumber: dto.phoneNumber.trim(), deliveryCity: ((_d = dto.deliveryCity) === null || _d === void 0 ? void 0 : _d.trim()) || undefined, additionalNotes: ((_e = dto.additionalNotes) === null || _e === void 0 ? void 0 : _e.trim()) || undefined, consentContact: dto.consentContact }));
            return this.toWithDetails(record);
        });
    }
    generateRequestNumber() {
        const year = new Date().getFullYear().toString().slice(-2);
        const random = Math.floor(100000 + Math.random() * 900000);
        return `SRC-${year}-${random}`;
    }
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const record = yield this.repo.findById(id);
            if (!record)
                throw ApiError_1.ApiError.notFound('Sourcing request not found');
            return this.toWithDetails(record);
        });
    }
    listForAdmin(filters_1) {
        return __awaiter(this, arguments, void 0, function* (filters, page = 1, limit = 50) {
            const result = yield this.repo.list(filters, page, limit);
            return Object.assign(Object.assign({}, result), { items: result.items.map((r) => this.toListItem(r)) });
        });
    }
    toListItem(r) {
        return {
            id: r.id,
            requestNumber: r.requestNumber,
            status: r.status,
            make: r.make,
            model: r.model,
            yearFrom: r.yearFrom,
            yearTo: r.yearTo,
            condition: r.condition,
            firstName: r.firstName,
            lastName: r.lastName,
            email: r.email,
            phoneNumber: r.phoneNumber,
            deliveryCity: r.deliveryCity,
            shippingMethod: r.shippingMethod,
            timeline: r.timeline,
            createdAt: r.createdAt,
        };
    }
    toWithDetails(r) {
        return Object.assign(Object.assign({}, this.toListItem(r)), { trim: r.trim, budgetUsd: r.budgetUsd, exteriorColor: r.exteriorColor, anyColor: r.anyColor, additionalNotes: r.additionalNotes, consentContact: r.consentContact, phoneCode: r.phoneCode, updatedAt: r.updatedAt });
    }
};
exports.SourcingRequestService = SourcingRequestService;
exports.SourcingRequestService = SourcingRequestService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.SourcingRequestRepository)),
    __metadata("design:paramtypes", [SourcingRequestRepository_1.SourcingRequestRepository])
], SourcingRequestService);
