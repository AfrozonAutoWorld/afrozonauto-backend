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
exports.TestimonialRepository = void 0;
const inversify_1 = require("inversify");
const db_1 = __importDefault(require("../db"));
let TestimonialRepository = class TestimonialRepository {
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.testimonial.create({ data });
        });
    }
    findApproved() {
        return __awaiter(this, arguments, void 0, function* (limit = 6) {
            return db_1.default.testimonial.findMany({
                where: { isApproved: true },
                orderBy: { publishedAt: "desc" },
                take: limit,
            });
        });
    }
    findFeatured() {
        return __awaiter(this, arguments, void 0, function* (limit = 6) {
            return db_1.default.testimonial.findMany({
                where: { isFeatured: true },
                orderBy: { publishedAt: "desc" },
                take: limit,
            });
        });
    }
    findUnfeatured() {
        return __awaiter(this, arguments, void 0, function* (limit = 6) {
            return db_1.default.testimonial.findMany({
                where: { isFeatured: false },
                orderBy: { publishedAt: "desc" },
                take: limit,
            });
        });
    }
    approve(id, adminId) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.testimonial.update({
                where: { id },
                data: {
                    isApproved: true,
                    publishedAt: new Date(),
                    approvedBy: adminId,
                },
            });
        });
    }
    feature(ids) {
        return __awaiter(this, void 0, void 0, function* () {
            const idArray = Array.isArray(ids) ? ids : [ids];
            const result = yield db_1.default.testimonial.updateMany({
                where: {
                    id: { in: idArray }
                },
                data: {
                    isFeatured: true,
                },
            });
            return { count: result.count };
        });
    }
    unfeature(ids) {
        return __awaiter(this, void 0, void 0, function* () {
            const idArray = Array.isArray(ids) ? ids : [ids];
            const result = yield db_1.default.testimonial.updateMany({
                where: {
                    id: { in: idArray }
                },
                data: {
                    isFeatured: false,
                },
            });
            return { count: result.count };
        });
    }
    featureOrUnfeature(ids, type) {
        return __awaiter(this, void 0, void 0, function* () {
            if (type === "feature") {
                return this.feature(ids);
            }
            else {
                return this.unfeature(ids);
            }
        });
    }
    /**
     * Get all testimonials with pagination and counts
     */
    findAllWithPagination() {
        return __awaiter(this, arguments, void 0, function* (page = 1, limit = 10, isFeatured) {
            const skip = (page - 1) * limit;
            // Build where clause
            const whereClause = {};
            if (isFeatured !== undefined) {
                whereClause.isFeatured = isFeatured;
            }
            // Get testimonials
            const [testimonials, total, featuredCount, unfeaturedCount] = yield Promise.all([
                db_1.default.testimonial.findMany({
                    where: whereClause,
                    orderBy: { publishedAt: "desc" },
                    skip,
                    take: limit,
                }),
                db_1.default.testimonial.count({ where: whereClause }),
                db_1.default.testimonial.count({ where: { isFeatured: true } }),
                db_1.default.testimonial.count({ where: { isFeatured: false } }),
            ]);
            const totalPages = Math.ceil(total / limit);
            return {
                testimonials,
                total,
                page,
                limit,
                totalPages,
                featuredCount,
                unfeaturedCount,
            };
        });
    }
    /**
     * Get all counts
     */
    getCounts() {
        return __awaiter(this, void 0, void 0, function* () {
            const [total, featured, unfeatured, approved, pending] = yield Promise.all([
                db_1.default.testimonial.count(),
                db_1.default.testimonial.count({ where: { isFeatured: true } }),
                db_1.default.testimonial.count({ where: { isFeatured: false } }),
                db_1.default.testimonial.count({ where: { isApproved: true } }),
                db_1.default.testimonial.count({ where: { isApproved: false } }),
            ]);
            return {
                total,
                featured,
                unfeatured,
                approved,
                pending,
            };
        });
    }
    /**
     * Toggle feature status with proper return
     */
    toggleFeature(ids) {
        return __awaiter(this, void 0, void 0, function* () {
            const idArray = Array.isArray(ids) ? ids : [ids];
            // First get current testimonials
            const testimonials = yield db_1.default.testimonial.findMany({
                where: {
                    id: { in: idArray }
                }
            });
            // Update each testimonial
            const updatePromises = testimonials.map(testimonial => db_1.default.testimonial.update({
                where: { id: testimonial.id },
                data: { isFeatured: !testimonial.isFeatured }
            }));
            return Promise.all(updatePromises);
        });
    }
};
exports.TestimonialRepository = TestimonialRepository;
exports.TestimonialRepository = TestimonialRepository = __decorate([
    (0, inversify_1.injectable)()
], TestimonialRepository);
