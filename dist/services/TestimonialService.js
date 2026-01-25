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
exports.TestimonialService = void 0;
const inversify_1 = require("inversify");
const types_1 = require("../config/types");
const ApiError_1 = require("../utils/ApiError");
let TestimonialService = class TestimonialService {
    constructor(repo) {
        this.repo = repo;
    }
    createFromOrder(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.repo.create({
                userId: payload.userId,
                orderId: payload.orderId,
                customerName: payload.customerName,
                customerCity: payload.location,
                rating: payload.rating,
                comment: payload.comment,
                vehicleSnapshot: payload.vehicle,
            });
        });
    }
    getHomepageTestimonials() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.repo.findApproved(6);
        });
    }
    approveTestimonial(id, adminId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.repo.approve(id, adminId);
        });
    }
    // Existing method - get featured testimonials
    getFeaturedTestimonies() {
        return __awaiter(this, arguments, void 0, function* (limit = 10) {
            return this.repo.findFeatured(limit);
        });
    }
    // New method - get testimonials with counts
    getTestimonialsWithStats() {
        return __awaiter(this, arguments, void 0, function* (page = 1, limit = 10, isFeatured) {
            return this.repo.findAllWithPagination(page, limit, isFeatured);
        });
    }
    // New method - get only counts
    getTestimonialCounts() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.repo.getCounts();
        });
    }
    // New method - get both featured and unfeatured
    getAllTestimonialsGrouped() {
        return __awaiter(this, arguments, void 0, function* (limit = 6) {
            const [featured, unfeatured, counts] = yield Promise.all([
                this.repo.findFeatured(limit),
                this.repo.findUnfeatured(limit),
                this.repo.getCounts()
            ]);
            return {
                featured: {
                    testimonials: featured,
                    count: counts.featured
                },
                unfeatured: {
                    testimonials: unfeatured,
                    count: counts.unfeatured
                },
                stats: counts
            };
        });
    }
    // Get testimonials for public API (approved only)
    getPublicTestimonials() {
        return __awaiter(this, arguments, void 0, function* (limit = 10, featuredOnly = false) {
            if (featuredOnly) {
                return this.repo.findFeatured(limit);
            }
            // Get all approved testimonials, featured first
            const [featured, regular] = yield Promise.all([
                this.repo.findFeatured(limit),
                this.repo.findUnfeatured(limit)
            ]);
            // Combine with featured first
            return [...featured, ...regular].slice(0, limit);
        });
    }
    featureTestimonials(ids, isFeature) {
        return __awaiter(this, void 0, void 0, function* () {
            const type = isFeature ? "feature" : "unfeature";
            return this.repo.featureOrUnfeature(ids, type);
        });
    }
    bulkUpdateFeatureStatus(ids, action) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (action) {
                case "feature":
                    return this.repo.feature(ids);
                case "unfeature":
                    return this.repo.unfeature(ids);
                case "toggle":
                    return this.repo.toggleFeature(ids);
                default:
                    throw ApiError_1.ApiError.badRequest(`Invalid action: ${action}`);
            }
        });
    }
};
exports.TestimonialService = TestimonialService;
exports.TestimonialService = TestimonialService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.TestimonialRepository)),
    __metadata("design:paramtypes", [Object])
], TestimonialService);
