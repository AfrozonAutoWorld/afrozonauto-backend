"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cookieConfig = void 0;
const secrets_1 = require("../secrets");
exports.cookieConfig = {
    secure: secrets_1.COOKIE_SECURE === 'true',
    sameSite: secrets_1.COOKIE_SAMESITE,
    domain: secrets_1.COOKIE_DOMAIN || undefined,
};
