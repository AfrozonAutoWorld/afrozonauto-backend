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
exports.SavedVehicleRepository = void 0;
const inversify_1 = require("inversify");
const db_1 = __importDefault(require("../db"));
let SavedVehicleRepository = class SavedVehicleRepository {
    /**
     * Get vehicle IDs saved by a user (most recent first), for personalization.
     */
    findVehicleIdsByUserId(userId, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            const rows = yield db_1.default.savedVehicle.findMany(Object.assign(Object.assign({ where: { userId }, orderBy: { createdAt: 'desc' } }, (limit != null && { take: limit })), { select: { vehicleId: true } }));
            return rows.map((r) => r.vehicleId);
        });
    }
    /**
     * Get full saved vehicles for the user (for "Saved" tab / list).
     */
    findSavedVehiclesByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const rows = yield db_1.default.savedVehicle.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                include: { vehicle: true },
            });
            return rows.map((r) => ({ vehicle: r.vehicle, savedAt: r.createdAt }));
        });
    }
    create(userId, vehicleId) {
        return __awaiter(this, void 0, void 0, function* () {
            const row = yield db_1.default.savedVehicle.create({
                data: { userId, vehicleId },
                select: { id: true, createdAt: true },
            });
            return row;
        });
    }
    deleteByUserAndVehicle(userId, vehicleId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db_1.default.savedVehicle.deleteMany({
                where: { userId, vehicleId },
            });
        });
    }
    exists(userId, vehicleId) {
        return __awaiter(this, void 0, void 0, function* () {
            const count = yield db_1.default.savedVehicle.count({
                where: { userId, vehicleId },
            });
            return count > 0;
        });
    }
};
exports.SavedVehicleRepository = SavedVehicleRepository;
exports.SavedVehicleRepository = SavedVehicleRepository = __decorate([
    (0, inversify_1.injectable)()
], SavedVehicleRepository);
