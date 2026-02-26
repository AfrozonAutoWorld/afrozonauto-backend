"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resend = void 0;
const resend_1 = require("resend");
const secrets_1 = require("../secrets");
if (!secrets_1.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not defined');
}
exports.resend = new resend_1.Resend(secrets_1.RESEND_API_KEY);
