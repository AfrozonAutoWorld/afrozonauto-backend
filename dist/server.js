"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const secrets_1 = require("./secrets");
const port = parseInt(secrets_1.PORT || '2026', 10);
const app = new app_1.default();
app.start(port);
