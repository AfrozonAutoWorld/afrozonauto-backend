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
exports.SourcingRequestRepository = void 0;
const inversify_1 = require("inversify");
const db_1 = __importDefault(require("../db"));
let SourcingRequestRepository = class SourcingRequestRepository {
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.sourcingRequest.create({ data });
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.sourcingRequest.findUnique({
                where: { id },
                include: { user: { select: { id: true, email: true, fullName: true } } },
            });
        });
    }
    findByRequestNumber(requestNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.sourcingRequest.findUnique({
                where: { requestNumber },
            });
        });
    }
    list(filters_1) {
        return __awaiter(this, arguments, void 0, function* (filters, page = 1, limit = 50) {
            const where = {};
            if (filters === null || filters === void 0 ? void 0 : filters.status)
                where.status = filters.status;
            if ((filters === null || filters === void 0 ? void 0 : filters.fromDate) || (filters === null || filters === void 0 ? void 0 : filters.toDate)) {
                where.createdAt = {};
                if (filters.fromDate)
                    where.createdAt.gte = filters.fromDate;
                if (filters.toDate)
                    where.createdAt.lte = filters.toDate;
            }
            const [items, total] = yield Promise.all([
                db_1.default.sourcingRequest.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip: (page - 1) * limit,
                    take: limit,
                }),
                db_1.default.sourcingRequest.count({ where }),
            ]);
            return {
                items,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1,
            };
        });
    }
};
exports.SourcingRequestRepository = SourcingRequestRepository;
exports.SourcingRequestRepository = SourcingRequestRepository = __decorate([
    (0, inversify_1.injectable)()
], SourcingRequestRepository);
