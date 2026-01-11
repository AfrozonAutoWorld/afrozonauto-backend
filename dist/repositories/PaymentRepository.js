"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRepository = void 0;
const inversify_1 = require("inversify");
const db_1 = __importDefault(require("../db"));
let PaymentRepository = class PaymentRepository {
    createPayment(data) {
        return db_1.default.payment.create({ data });
    }
    updatePaymentByRef(reference, data) {
        return db_1.default.payment.update({
            where: { transactionRef: reference },
            data
        });
    }
    findByReference(reference) {
        return db_1.default.payment.findFirst({
            where: { transactionRef: reference },
            include: { order: true }
        });
    }
    updateByReference(transactionRef, data) {
        return db_1.default.payment.update({
            where: { transactionRef },
            data
        });
    }
};
exports.PaymentRepository = PaymentRepository;
exports.PaymentRepository = PaymentRepository = __decorate([
    (0, inversify_1.injectable)()
], PaymentRepository);
