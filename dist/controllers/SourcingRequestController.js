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
exports.SourcingRequestController = void 0;
const SourcingRequestService_1 = require("../services/SourcingRequestService");
const MailService_1 = require("../services/MailService");
const ApiResponse_1 = require("../utils/ApiResponse");
const asyncHandler_1 = require("../utils/asyncHandler");
const types_1 = require("../config/types");
const inversify_1 = require("inversify");
const client_1 = require("../generated/prisma/client");
let SourcingRequestController = class SourcingRequestController {
    constructor(service, mailService) {
        this.service = service;
        this.mailService = mailService;
        this.create = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const dto = req.body;
            const created = yield this.service.create(dto, userId === null || userId === void 0 ? void 0 : userId.toString());
            // Email failure should not cause failure of the request.
            this.mailService
                .sendSourcingRequestConfirmation(created.email, created.requestNumber, created.firstName)
                .catch((err) => {
                console.error('Failed to send sourcing request confirmation email:', err);
            });
            return res.status(201).json(ApiResponse_1.ApiResponse.success(created, 'Sourcing request submitted successfully. We will contact you within 48 hours.'));
        }));
        this.listForAdmin = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const status = req.query.status;
            const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
            const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit), 10) || 20));
            const filters = status && Object.values(client_1.SourcingRequestStatus).includes(status) ? { status } : undefined;
            const result = yield this.service.listForAdmin(filters, page, limit);
            return res.status(200).json(ApiResponse_1.ApiResponse.success(result, 'Sourcing requests retrieved successfully'));
        }));
        this.getById = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const request = yield this.service.getById(id);
            return res.status(200).json(ApiResponse_1.ApiResponse.success(request, 'Sourcing request retrieved successfully'));
        }));
    }
};
exports.SourcingRequestController = SourcingRequestController;
exports.SourcingRequestController = SourcingRequestController = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.SourcingRequestService)),
    __param(1, (0, inversify_1.inject)(types_1.TYPES.MailService)),
    __metadata("design:paramtypes", [SourcingRequestService_1.SourcingRequestService,
        MailService_1.MailService])
], SourcingRequestController);
