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
exports.TrendingDefinitionController = void 0;
const inversify_1 = require("inversify");
const types_1 = require("../config/types");
const TrendingDefinitionRepository_1 = require("../repositories/TrendingDefinitionRepository");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const client_1 = require("../generated/prisma/client");
let TrendingDefinitionController = class TrendingDefinitionController {
    constructor(repo) {
        this.repo = repo;
        this.list = (0, asyncHandler_1.asyncHandler)((_req, res) => __awaiter(this, void 0, void 0, function* () {
            const list = yield this.repo.findMany();
            return res.json(ApiResponse_1.ApiResponse.success(list, 'Trending definitions retrieved'));
        }));
        this.getById = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const item = yield this.repo.findById(id);
            if (!item)
                throw ApiError_1.ApiError.notFound('Trending definition not found');
            return res.json(ApiResponse_1.ApiResponse.success(item, 'Trending definition retrieved'));
        }));
        this.create = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== client_1.UserRole.SUPER_ADMIN && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== client_1.UserRole.OPERATIONS_ADMIN) {
                throw ApiError_1.ApiError.forbidden('Admin only');
            }
            const { make, model, yearStart, yearEnd, label, sortOrder, isActive } = req.body;
            if (!make || yearStart == null || yearEnd == null) {
                throw ApiError_1.ApiError.badRequest('make, yearStart, yearEnd are required');
            }
            const item = yield this.repo.create({
                make,
                model: model !== null && model !== void 0 ? model : undefined,
                yearStart: Number(yearStart),
                yearEnd: Number(yearEnd),
                label: label !== null && label !== void 0 ? label : undefined,
                sortOrder: sortOrder != null ? Number(sortOrder) : 0,
                isActive: isActive !== false,
            });
            return res.status(201).json(ApiResponse_1.ApiResponse.created(item, 'Trending definition created'));
        }));
        this.update = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== client_1.UserRole.SUPER_ADMIN && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== client_1.UserRole.OPERATIONS_ADMIN) {
                throw ApiError_1.ApiError.forbidden('Admin only');
            }
            const { id } = req.params;
            const existing = yield this.repo.findById(id);
            if (!existing)
                throw ApiError_1.ApiError.notFound('Trending definition not found');
            const { make, model, yearStart, yearEnd, label, sortOrder, isActive } = req.body;
            const item = yield this.repo.update(id, Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (make != null && { make })), (model !== undefined && { model })), (yearStart != null && { yearStart: Number(yearStart) })), (yearEnd != null && { yearEnd: Number(yearEnd) })), (label !== undefined && { label })), (sortOrder != null && { sortOrder: Number(sortOrder) })), (isActive !== undefined && { isActive: !!isActive })));
            return res.json(ApiResponse_1.ApiResponse.success(item, 'Trending definition updated'));
        }));
        this.delete = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== client_1.UserRole.SUPER_ADMIN && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== client_1.UserRole.OPERATIONS_ADMIN) {
                throw ApiError_1.ApiError.forbidden('Admin only');
            }
            const { id } = req.params;
            const existing = yield this.repo.findById(id);
            if (!existing)
                throw ApiError_1.ApiError.notFound('Trending definition not found');
            yield this.repo.delete(id);
            return res.json(ApiResponse_1.ApiResponse.success(null, 'Trending definition deleted'));
        }));
    }
};
exports.TrendingDefinitionController = TrendingDefinitionController;
exports.TrendingDefinitionController = TrendingDefinitionController = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.TrendingDefinitionRepository)),
    __metadata("design:paramtypes", [TrendingDefinitionRepository_1.TrendingDefinitionRepository])
], TrendingDefinitionController);
