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
exports.TestimonialController = void 0;
const inversify_1 = require("inversify");
const TestimonialService_1 = require("../services/TestimonialService");
const types_1 = require("../config/types");
const ApiError_1 = require("../utils/ApiError");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiResponse_1 = require("../utils/ApiResponse");
const ProfileService_1 = require("../services/ProfileService");
const AddressService_1 = require("../services/AddressService");
const enums_1 = require("../generated/prisma/enums");
let TestimonialController = class TestimonialController {
    constructor(service, profileService, addressService) {
        this.service = service;
        this.profileService = profileService;
        this.addressService = addressService;
        // Get all testimonials with pagination and stats
        this.getAllTestimonials = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const isFeatured = req.query.featured ? req.query.featured === 'true' : undefined;
            const data = yield this.service.getTestimonialsWithStats(page, limit, isFeatured);
            return res.status(200).json(ApiResponse_1.ApiResponse.success(data, "Testimonials retrieved successfully"));
        }));
        // Get testimonial counts
        this.getTestimonialCounts = (0, asyncHandler_1.asyncHandler)((_req, res) => __awaiter(this, void 0, void 0, function* () {
            const counts = yield this.service.getTestimonialCounts();
            return res.status(200).json(ApiResponse_1.ApiResponse.success(counts, "Testimonial counts retrieved"));
        }));
        // Get grouped testimonials (featured + unfeatured)
        this.getGroupedTestimonials = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const limit = parseInt(req.query.limit) || 6;
            const data = yield this.service.getAllTestimonialsGrouped(limit);
            return res.status(200).json(ApiResponse_1.ApiResponse.success(data, "Grouped testimonials retrieved"));
        }));
        // Public API - get testimonials for website
        this.getPublicTestimonials = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const limit = parseInt(req.query.limit) || 10;
            const featuredOnly = req.query.featuredOnly === 'true';
            const testimonials = yield this.service.getPublicTestimonials(limit, featuredOnly);
            return res.status(200).json(ApiResponse_1.ApiResponse.success({
                testimonials,
                count: testimonials.length
            }, "Testimonials retrieved successfully"));
        }));
        // Feature/unfeature testimonials
        this.bulkUpdateFeatureStatus = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { ids, action } = req.body;
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json(ApiError_1.ApiError.badRequest("IDs array is required"));
            }
            if (!['feature', 'unfeature', 'toggle'].includes(action)) {
                return res.status(400).json(ApiError_1.ApiError.badRequest("Action must be 'feature', 'unfeature', or 'toggle'"));
            }
            const result = yield this.service.bulkUpdateFeatureStatus(ids, action);
            // Get updated counts
            const counts = yield this.service.getTestimonialCounts();
            return res.status(200).json(ApiResponse_1.ApiResponse.success({
                result,
                stats: counts
            }, `Testimonials ${action}ed successfully`));
        }));
        // Customer submits testimonial
        this.create = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            if (!req.user) {
                return res.status(401).json(ApiError_1.ApiError.unauthorized('User not authenticated'));
            }
            let validatedBody = req.body;
            const userId = req.user.id;
            const profile = yield this.profileService.findUserById(userId.toString());
            if (!profile) {
                return res.status(404).json(ApiError_1.ApiError.notFound('Profile not found. Please complete your profile first.'));
            }
            const address = yield this.addressService.getDefaultAddress(profile.id, enums_1.AddressType.NORMAL);
            if (!address) {
                return res.status(400).json(ApiError_1.ApiError.badRequest('Default address required. Please set a default address.'));
            }
            const files = validatedBody.uploadedFiles || [];
            const customerName = `${profile.firstName} ${profile.lastName}`.trim();
            // 5. Atomic Creation
            const testimonial = yield this.service.createFromOrder(Object.assign(Object.assign({}, validatedBody), { files,
                userId,
                customerName, customerCity: address.city, customerState: address.state, customerCountry: address.country }));
            return res.status(201).json(ApiResponse_1.ApiResponse.created(testimonial));
        }));
        // Admin approves
        this.approve = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            if (!req.user) {
                return res.status(401).json(ApiError_1.ApiError.unauthorized('User not authenticated'));
            }
            const adminId = req.user.id;
            const result = yield this.service.approveTestimonial(id, adminId);
            res.json({ success: true, result });
        }));
    }
};
exports.TestimonialController = TestimonialController;
exports.TestimonialController = TestimonialController = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.TestimonialService)),
    __param(1, (0, inversify_1.inject)(types_1.TYPES.ProfileService)),
    __param(2, (0, inversify_1.inject)(types_1.TYPES.AddressService)),
    __metadata("design:paramtypes", [TestimonialService_1.TestimonialService,
        ProfileService_1.ProfileService,
        AddressService_1.AddressService])
], TestimonialController);
