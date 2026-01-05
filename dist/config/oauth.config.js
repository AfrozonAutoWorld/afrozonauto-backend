"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const google_auth_library_1 = require("google-auth-library");
const secrets_1 = require("../secrets");
exports.default = new google_auth_library_1.OAuth2Client(secrets_1.GOOGLE_CLIENT_ID, secrets_1.GOOGLE_CLIENT_SECRET, 
// GOOGLE_REDIRECT_URI
"postmessage");
