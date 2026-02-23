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
exports.VehicleCategoryRepository = void 0;
const inversify_1 = require("inversify");
const db_1 = __importDefault(require("../db"));
let VehicleCategoryRepository = class VehicleCategoryRepository {
    findManyActive() {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.vehicleCategory.findMany({
                where: { isActive: true },
                orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
            });
        });
    }
    findMany() {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.vehicleCategory.findMany({
                orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
            });
        });
    }
    findBySlug(slug) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.vehicleCategory.findUnique({
                where: { slug: slug.toLowerCase().trim(), isActive: true },
            });
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.vehicleCategory.findUnique({ where: { id } });
        });
    }
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.vehicleCategory.create({ data });
        });
    }
    update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.vehicleCategory.update({ where: { id }, data });
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.vehicleCategory.delete({ where: { id } });
        });
    }
};
exports.VehicleCategoryRepository = VehicleCategoryRepository;
exports.VehicleCategoryRepository = VehicleCategoryRepository = __decorate([
    (0, inversify_1.injectable)()
], VehicleCategoryRepository);
