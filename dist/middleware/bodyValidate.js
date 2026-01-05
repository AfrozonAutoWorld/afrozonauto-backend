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
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = void 0;
const validateBody = (schema) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            // use validateAsync to support .external() async rules
            const value = yield schema.validateAsync(req.body, {
                abortEarly: false,
                stripUnknown: true,
            });
            req.body = value;
            next();
        }
        catch (error) {
            if (error.isJoi) {
                const details = (_a = error.details) === null || _a === void 0 ? void 0 : _a.map((d) => {
                    var _a;
                    return ({
                        field: (_a = d.context) === null || _a === void 0 ? void 0 : _a.key,
                        message: d.message.replace(/["]/g, ''),
                    });
                });
                return res.status(400).json({
                    error: 'Validation failed',
                    details,
                });
            }
            next(error);
        }
    });
};
exports.validateBody = validateBody;
