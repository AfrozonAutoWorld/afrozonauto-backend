"use strict";
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
exports.sendMail = exports.mailerActive = exports.getTransporter = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const secrets_1 = require("../secrets");
const loggers_1 = __importDefault(require("./loggers"));
const ApiError_1 = require("./ApiError");
const resend_config_1 = require("../config/resend.config");
// Singleton transporter instance
let transporter = null;
/**
 * Get or create nodemailer transporter
 */
const getTransporter = () => {
    if (!transporter) {
        // Validate required environment variables
        if (!secrets_1.MAIL_HOST) {
            throw ApiError_1.ApiError.internal('MAIL_HOST is not configured. Please set MAIL_HOST in the environment variables.');
        }
        if (!secrets_1.FROM_EMAIL) {
            throw ApiError_1.ApiError.internal('FROM_EMAIL is not configured. Please set FROM_EMAIL in the environment variables.');
        }
        const port = Number(secrets_1.MAIL_PORT) || 587; // Default to 587 for TLS
        const isSecure = port === 465; // Only 465 uses SSL, 587 uses TLS
        // Determine authentication user (prefer MAIL_USERNAME, fallback to FROM_EMAIL)
        const authUser = secrets_1.MAIL_USERNAME || secrets_1.FROM_EMAIL;
        // Configuration object
        const config = {
            host: secrets_1.MAIL_HOST || "mail.privateemail.com",
            port: port,
            secure: isSecure, // true for 465, false for 587
        };
        // Add authentication if credentials are provided
        if (authUser && secrets_1.MAIL_PASSWORD) {
            config.auth = {
                user: authUser,
                pass: secrets_1.MAIL_PASSWORD,
            };
        }
        // TLS configuration for port 587
        if (port === 587) {
            config.tls = {
                ciphers: 'SSLv3',
                rejectUnauthorized: false,
            };
            config.requireTLS = true;
        }
        else if (port === 465) {
            // SSL configuration for port 465
            config.tls = {
                rejectUnauthorized: false,
            };
        }
        loggers_1.default.info('Creating email transporter with config:', {
            host: secrets_1.MAIL_HOST,
            port: port,
            secure: isSecure,
            authUser: authUser,
            hasPassword: !!secrets_1.MAIL_PASSWORD
        });
        transporter = nodemailer_1.default.createTransport(config);
    }
    return transporter;
};
exports.getTransporter = getTransporter;
const mailerActive = () => __awaiter(void 0, void 0, void 0, function* () {
    const transporter = (0, exports.getTransporter)();
    try {
        yield transporter.verify();
        loggers_1.default.info("✅ Mail server is ready to take messages");
    }
    catch (error) {
        loggers_1.default.error("🙈 Mail server connection failed:", error);
        throw ApiError_1.ApiError.internal(error.message || "Mail server is not available");
    }
});
exports.mailerActive = mailerActive;
// Helper function to create text version from HTML
function stripHtml(html) {
    return html
        .replace(/<[^>]*>?/gm, '') // Remove HTML tags
        .replace(/\s+/g, ' ') // Collapse whitespace
        .trim();
}
// const sendMail = async (to: string, subject: string, html: string, textContent?: string) => {
//   const transporter = getTransporter();
//   const mailOptions = {
//     from: FROM_EMAIL,
//     to: to,
//     subject: subject,
//     html: html,
//     text: textContent || stripHtml(html)
//   };
//   logger.info(`Sending mail to - ${to}`);
//   await transporter.sendMail(mailOptions, (error, info) => {
//     if (error) {
//       console.log(error);
//       logger.error(error);
//     } else {
//       logger.info('Email sent: ' + info.response);
//     }
//   });
// }
const sendMail = (to, subject, html, textContent) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        loggers_1.default.info(`Sending mail to - ${to}`);
        const { data, error } = yield resend_config_1.resend.emails.send({
            from: secrets_1.RESEND_EMAIL,
            to,
            subject,
            html,
        });
        if (error) {
            loggers_1.default.error('Resend email error:', error);
            throw error;
        }
        loggers_1.default.info(`Email sent successfully. ID: ${data === null || data === void 0 ? void 0 : data.id}`);
        return data;
    }
    catch (err) {
        loggers_1.default.error('Failed to send email:', err);
        throw err;
    }
});
exports.sendMail = sendMail;
exports.default = exports.sendMail;
