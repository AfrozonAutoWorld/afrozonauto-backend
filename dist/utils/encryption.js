"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSecurePassword = exports.decryptData = exports.encryptData = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const secrets_1 = require("../secrets");
const ALGORITHM = secrets_1.ENCRYPTION_ALGO || "aes-256-cbc";
const SECRET_KEY = secrets_1.ENCRYPTION_SECRET.padEnd(32, "0");
const IV_LENGTH = 16;
const encryptData = (text) => {
    const iv = node_crypto_1.default.randomBytes(IV_LENGTH);
    const cipher = node_crypto_1.default.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
};
exports.encryptData = encryptData;
const decryptData = (encryptedText) => {
    const [ivHex, encryptedHex] = encryptedText.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const decipher = node_crypto_1.default.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
};
exports.decryptData = decryptData;
const generateSecurePassword = () => {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const specialChars = "!@#$%^&*";
    // Ensure at least one of each type
    const getRandom = (chars) => chars[Math.floor(Math.random() * chars.length)];
    const passwordArray = [
        getRandom(lowercase),
        getRandom(uppercase),
        getRandom(numbers),
        getRandom(specialChars),
    ];
    // Fill remaining characters randomly (8–12 chars total)
    const allChars = lowercase + uppercase + numbers + specialChars;
    const remainingLength = Math.floor(Math.random() * 5) + 8; // 8–12 total
    for (let i = passwordArray.length; i < remainingLength; i++) {
        passwordArray.push(getRandom(allChars));
    }
    // Shuffle password characters for randomness
    return passwordArray.sort(() => 0.5 - Math.random()).join("");
};
exports.generateSecurePassword = generateSecurePassword;
