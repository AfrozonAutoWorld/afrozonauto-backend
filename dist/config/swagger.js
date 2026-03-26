"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const swaggerSpec = {
    openapi: "3.0.0",
    info: {
        title: "Afrozon AutoGlobal API",
        version: "1.0.0",
        description: "API for Afrozon AutoGlobal - Vehicle Marketplace and Management",
    },
    servers: [
        {
            url: "http://localhost:2026",
            description: "Development server",
        },
        {
            url: "https://api.afrozonauto.com",
            description: "Production server",
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
            },
        },
        schemas: {
            // Basic schemas will be added as we go
            AuthResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: { type: "object" }
                }
            },
            PlatformBankAccount: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    label: { type: "string", example: "USD - Domiciliary Account" },
                    bankName: { type: "string", example: "Guaranty Trust Bank" },
                    bankCode: { type: "string", nullable: true },
                    accountName: { type: "string", example: "Afrozon AutoGlobal Ltd" },
                    accountNumber: { type: "string", example: "0123456789" },
                    currency: { type: "string", enum: ["USD", "NGN", "GBP", "EUR", "GHS", "KES", "ZAR"] },
                    country: { type: "string", example: "NG" },
                    swiftCode: { type: "string", nullable: true },
                    iban: { type: "string", nullable: true },
                    sortCode: { type: "string", nullable: true },
                    routingNumber: { type: "string", nullable: true },
                    bankAddress: { type: "string", nullable: true },
                    isActive: { type: "boolean" },
                    isPrimary: { type: "boolean" },
                    displayOrder: { type: "integer" },
                    instructions: { type: "string", nullable: true, example: "Use your Order ID as the payment reference" },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" }
                }
            },
            CreatePlatformBankAccountInput: {
                type: "object",
                required: ["label", "bankName", "accountName", "accountNumber", "currency", "country"],
                properties: {
                    label: { type: "string", example: "NGN - Naira Account" },
                    bankName: { type: "string", example: "First Bank" },
                    bankCode: { type: "string" },
                    accountName: { type: "string", example: "Afrozon AutoGlobal Ltd" },
                    accountNumber: { type: "string", example: "3012345678" },
                    currency: { type: "string", enum: ["USD", "NGN", "GBP", "EUR", "GHS", "KES", "ZAR"] },
                    country: { type: "string", example: "NG", description: "ISO 3166-1 alpha-2 country code" },
                    swiftCode: { type: "string" },
                    iban: { type: "string" },
                    sortCode: { type: "string" },
                    routingNumber: { type: "string" },
                    bankAddress: { type: "string" },
                    isPrimary: { type: "boolean", default: false },
                    displayOrder: { type: "integer", default: 0 },
                    instructions: { type: "string", example: "Use your Order ID as the payment reference" },
                    notes: { type: "string", description: "Internal admin note" }
                }
            },
            UpdatePlatformBankAccountInput: {
                type: "object",
                minProperties: 1,
                properties: {
                    label: { type: "string" },
                    bankName: { type: "string" },
                    bankCode: { type: "string" },
                    accountName: { type: "string" },
                    accountNumber: { type: "string" },
                    currency: { type: "string", enum: ["USD", "NGN", "GBP", "EUR", "GHS", "KES", "ZAR"] },
                    country: { type: "string" },
                    swiftCode: { type: "string", nullable: true },
                    iban: { type: "string", nullable: true },
                    sortCode: { type: "string", nullable: true },
                    routingNumber: { type: "string", nullable: true },
                    bankAddress: { type: "string", nullable: true },
                    isActive: { type: "boolean" },
                    isPrimary: { type: "boolean" },
                    displayOrder: { type: "integer" },
                    instructions: { type: "string", nullable: true },
                    notes: { type: "string", nullable: true }
                }
            },
        },
    },
    security: [
        {
            bearerAuth: [],
        },
    ],
    paths: {
        // AUTH ENDPOINTS (AuthRoutes.ts)
        "/api/auth/register-start": {
            post: {
                summary: "Check user availability before registration",
                tags: ["Auth"],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { type: "object", properties: { email: { type: "string" } } } } }
                },
                responses: { 200: { description: "User checked" } }
            }
        },
        "/api/auth/register": {
            post: {
                summary: "Register a new user",
                tags: ["Auth"],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { type: "object", required: ["email", "password", "profile"], properties: { email: { type: "string" }, password: { type: "string" }, phoneNumber: { type: "string" }, profile: { type: "object", properties: { firstName: { type: "string" }, lastName: { type: "string" } } } } } } }
                },
                responses: { 201: { description: "User registered" } }
            }
        },
        "/api/auth/login": {
            post: {
                summary: "Login",
                tags: ["Auth"],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { type: "object", required: ["email", "password"], properties: { email: { type: "string" }, password: { type: "string" } } } } }
                },
                responses: { 200: { description: "Login successful" } }
            }
        },
        "/api/auth/verify": {
            post: {
                summary: "Verify user email token",
                tags: ["Auth"],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { type: "object", required: ["email", "token"], properties: { email: { type: "string" }, token: { type: "string" } } } } }
                },
                responses: { 200: { description: "Email verified" } }
            }
        },
        "/api/auth/forgot-password": {
            post: {
                summary: "Request password reset link",
                tags: ["Auth"],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { type: "object", required: ["email"], properties: { email: { type: "string" } } } } }
                },
                responses: { 200: { description: "Reset email sent" } }
            }
        },
        "/api/auth/reset-password": {
            post: {
                summary: "Reset password with token",
                tags: ["Auth"],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { type: "object", required: ["email", "token", "password"], properties: { email: { type: "string" }, token: { type: "string" }, password: { type: "string" } } } } }
                },
                responses: { 200: { description: "Password reset successful" } }
            }
        },
        "/api/auth/me": {
            get: {
                summary: "Get current user info (cookie based)",
                tags: ["Auth"],
                responses: { 200: { description: "Current user" } }
            }
        },
        "/api/auth/send-token-recovery-email": {
            post: {
                summary: "Resend email verification token",
                description: "Sends a fresh OTP to the user's email address so they can complete verification.",
                tags: ["Auth"],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { type: "object", required: ["email"], properties: { email: { type: "string", format: "email" } } } } }
                },
                responses: {
                    200: { description: "Recovery token sent" },
                    404: { description: "User not found" }
                }
            }
        },
        "/api/auth/token-validation-reset": {
            post: {
                summary: "Validate reset token before setting a new password",
                description: "Checks that the one-time reset token is valid and not expired. Call this before /reset-password.",
                tags: ["Auth"],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { type: "object", required: ["email", "token"], properties: { email: { type: "string", format: "email" }, token: { type: "string" } } } } }
                },
                responses: {
                    200: { description: "Token is valid" },
                    400: { description: "Invalid or expired token" }
                }
            }
        },
        "/api/auth/refresh-token": {
            post: {
                summary: "Refresh access token",
                description: "Issues a new short-lived JWT access token using the refresh token stored in the HTTP-only cookie.",
                tags: ["Auth"],
                responses: {
                    200: { description: "New access token returned" },
                    401: { description: "Refresh token missing or expired" }
                }
            }
        },
        "/api/auth/google-auth-verify": {
            post: {
                summary: "Sign in / register via Google",
                description: "Verifies the Google ID token from the client and returns an access token. Creates a new account if the user does not exist.",
                tags: ["Auth"],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { type: "object", required: ["idToken"], properties: { idToken: { type: "string", description: "Google ID token from client-side Google Sign-In" } } } } }
                },
                responses: {
                    200: { description: "Authenticated — returns user and access token" },
                    400: { description: "Invalid Google token" }
                }
            }
        },
        "/api/auth/apple-auth-initiate": {
            post: {
                summary: "Initiate Apple Sign In",
                description: "Exchanges the Apple identity token/authorization code for an access token and user record.",
                tags: ["Auth"],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { type: "object", required: ["identityToken"], properties: { identityToken: { type: "string" }, authorizationCode: { type: "string" }, fullName: { type: "object", properties: { firstName: { type: "string" }, lastName: { type: "string" } } } } } } }
                },
                responses: {
                    200: { description: "Authenticated — returns user and access token" },
                    400: { description: "Invalid Apple token" }
                }
            }
        },
        // USER ENDPOINTS (UserRoutes.ts)
        "/api/users/": {
            get: {
                summary: "Get all users (Admin only)",
                tags: ["Users"],
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: "List of users" } }
            }
        },
        "/api/users/user-email/{email}": {
            get: {
                summary: "Get user by email",
                tags: ["Users"],
                parameters: [{ name: "email", in: "path", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "User details" } }
            }
        },
        "/api/users/user-id/{userId}": {
            get: {
                summary: "Get user by ID",
                tags: ["Users"],
                parameters: [{ name: "userId", in: "path", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "User details" } }
            }
        },
        "/api/users/user-deactivate/{userId}": {
            delete: {
                summary: "Deactivate active user account (Admin only)",
                tags: ["Users"],
                parameters: [{ name: "userId", in: "path", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "Account deactivated" } }
            }
        },
        // VEHICLE ENDPOINTS (VehicleRoutes.ts)
        "/api/vehicles": {
            get: {
                summary: "Get all vehicles with filters",
                tags: ["Vehicles"],
                parameters: [
                    { name: "make", in: "query", schema: { type: "string" } },
                    { name: "model", in: "query", schema: { type: "string" } },
                    { name: "year", in: "query", schema: { type: "integer" } },
                    { name: "minPrice", in: "query", schema: { type: "number" } },
                    { name: "maxPrice", in: "query", schema: { type: "number" } }
                ],
                responses: { 200: { description: "List of vehicles" } }
            },
            post: {
                summary: "Create a new vehicle listing",
                tags: ["Vehicles"],
                security: [{ bearerAuth: [] }],
                responses: { 201: { description: "Vehicle created" } }
            }
        },
        "/api/vehicles/trending": {
            get: {
                summary: "Get trending vehicles",
                tags: ["Vehicles"],
                responses: { 200: { description: "List of trending vehicles" } }
            }
        },
        "/api/vehicles/recommended": {
            get: {
                summary: "Get recommended vehicles for user",
                tags: ["Vehicles"],
                responses: { 200: { description: "List of recommended vehicles" } }
            }
        },
        "/api/vehicles/specialty": {
            get: {
                summary: "Get specialty vehicles",
                tags: ["Vehicles"],
                responses: { 200: { description: "List of specialty vehicles" } }
            }
        },
        "/api/vehicles/categories": {
            get: {
                summary: "Get vehicle categories",
                tags: ["Vehicles"],
                responses: { 200: { description: "List of categories" } }
            }
        },
        "/api/vehicles/{identifier}": {
            get: {
                summary: "Get vehicle by ID or VIN",
                tags: ["Vehicles"],
                parameters: [{ name: "identifier", in: "path", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "Vehicle details" } }
            },
            put: {
                summary: "Update vehicle (Admin)",
                tags: ["Vehicles"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "identifier", in: "path", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "Vehicle updated" } }
            },
            delete: {
                summary: "Delete vehicle (Admin)",
                tags: ["Vehicles"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "identifier", in: "path", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "Vehicle deleted" } }
            }
        },
        "/api/vehicles/reference/models": {
            get: {
                summary: "Get make/model reference list",
                description: "Returns all makes and their corresponding models for use in dropdowns and filters.",
                tags: ["Vehicles"],
                responses: { 200: { description: "Make–model map" } }
            }
        },
        "/api/vehicles/sync/{vin}": {
            post: {
                summary: "Sync vehicle data by VIN (Admin)",
                description: "Fetches latest data for a vehicle from the external NHTSA / VIN decoder API and updates the record.",
                tags: ["Vehicles"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "vin", in: "path", required: true, schema: { type: "string" }, description: "17-character VIN" }],
                responses: {
                    200: { description: "Vehicle synced" },
                    404: { description: "VIN not found" }
                }
            }
        },
        "/api/vehicles/save-from-api": {
            post: {
                summary: "Save a vehicle from external API data (Admin)",
                description: "Creates a new vehicle record from a structured payload sourced from an external listing API.",
                tags: ["Vehicles"],
                security: [{ bearerAuth: [] }],
                requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
                responses: { 201: { description: "Vehicle saved" } }
            }
        },
        // Saved vehicles
        "/api/vehicles/saved": {
            get: {
                summary: "Get current user's saved vehicles",
                tags: ["Vehicles – Saved"],
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: "List of saved vehicles" } }
            },
            post: {
                summary: "Save a vehicle to favourites",
                tags: ["Vehicles – Saved"],
                security: [{ bearerAuth: [] }],
                requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["vehicleId"], properties: { vehicleId: { type: "string" } } } } } },
                responses: {
                    201: { description: "Vehicle saved" },
                    409: { description: "Already saved" }
                }
            }
        },
        "/api/vehicles/saved/{vehicleId}": {
            delete: {
                summary: "Remove a vehicle from favourites",
                tags: ["Vehicles – Saved"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "vehicleId", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    200: { description: "Removed from saved" },
                    404: { description: "Not found in saved list" }
                }
            }
        },
        // Trending definitions (Admin)
        "/api/vehicles/trending-definitions": {
            get: {
                summary: "List trending vehicle definitions (Admin)",
                tags: ["Vehicles – Admin Definitions"],
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: "Trending definitions list" } }
            },
            post: {
                summary: "Create a trending definition (Admin)",
                tags: ["Vehicles – Admin Definitions"],
                security: [{ bearerAuth: [] }],
                requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
                responses: { 201: { description: "Definition created" } }
            }
        },
        "/api/vehicles/trending-definitions/{id}": {
            get: {
                summary: "Get trending definition by ID (Admin)",
                tags: ["Vehicles – Admin Definitions"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "Definition details" }, 404: { description: "Not found" } }
            },
            put: {
                summary: "Update trending definition (Admin)",
                tags: ["Vehicles – Admin Definitions"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
                responses: { 200: { description: "Updated" } }
            },
            delete: {
                summary: "Delete trending definition (Admin)",
                tags: ["Vehicles – Admin Definitions"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "Deleted" } }
            }
        },
        // Recommended definitions (Admin)
        "/api/vehicles/recommended-definitions": {
            get: {
                summary: "List recommended vehicle definitions (Admin)",
                tags: ["Vehicles – Admin Definitions"],
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: "Recommended definitions list" } }
            },
            post: {
                summary: "Create a recommended definition (Admin)",
                tags: ["Vehicles – Admin Definitions"],
                security: [{ bearerAuth: [] }],
                requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
                responses: { 201: { description: "Definition created" } }
            }
        },
        "/api/vehicles/recommended-definitions/{id}": {
            get: {
                summary: "Get recommended definition by ID (Admin)",
                tags: ["Vehicles – Admin Definitions"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "Definition details" }, 404: { description: "Not found" } }
            },
            put: {
                summary: "Update recommended definition (Admin)",
                tags: ["Vehicles – Admin Definitions"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
                responses: { 200: { description: "Updated" } }
            },
            delete: {
                summary: "Delete recommended definition (Admin)",
                tags: ["Vehicles – Admin Definitions"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "Deleted" } }
            }
        },
        // Vehicle categories (Admin)
        "/api/vehicles/admin/categories": {
            get: {
                summary: "List vehicle categories (Admin)",
                tags: ["Vehicles – Admin Definitions"],
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: "Categories list" } }
            },
            post: {
                summary: "Create a vehicle category (Admin)",
                tags: ["Vehicles – Admin Definitions"],
                security: [{ bearerAuth: [] }],
                requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["name"], properties: { name: { type: "string" }, description: { type: "string" } } } } } },
                responses: { 201: { description: "Category created" } }
            }
        },
        "/api/vehicles/admin/categories/{id}": {
            get: {
                summary: "Get vehicle category by ID (Admin)",
                tags: ["Vehicles – Admin Definitions"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "Category details" }, 404: { description: "Not found" } }
            },
            put: {
                summary: "Update vehicle category (Admin)",
                tags: ["Vehicles – Admin Definitions"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
                responses: { 200: { description: "Updated" } }
            },
            delete: {
                summary: "Delete vehicle category (Admin)",
                tags: ["Vehicles – Admin Definitions"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "Deleted" } }
            }
        },
        // SELLER ENDPOINTS (SellerRoutes.ts)
        "/api/sellers/check-email": {
            post: {
                summary: "Verify seller email exists",
                tags: ["Sellers"],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { type: "object", properties: { email: { type: "string" } } } } }
                },
                responses: { 200: { description: "Email checked" } }
            }
        },
        "/api/sellers/verify-token": {
            post: {
                summary: "Verify the token sent to the email for seller flow",
                tags: ["Sellers"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["email", "token"],
                                properties: {
                                    email: { type: "string", format: "email" },
                                    token: { type: "number", example: 123456 }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: "Email verified successfully" },
                    400: { description: "Invalid token or email" }
                }
            }
        },
        "/api/sellers/register": {
            post: {
                summary: "Specialized registration for sellers (guest -> pending seller)",
                description: "This requires the email to have been verified via /api/sellers/verify-token first. The request should be multipart/form-data for files.",
                tags: ["Sellers"],
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                required: ["email", "password", "firstName", "lastName", "files"],
                                properties: {
                                    email: { type: "string", format: "email" },
                                    password: { type: "string", minLength: 6 },
                                    firstName: { type: "string" },
                                    lastName: { type: "string" },
                                    phone: { type: "string" },
                                    businessName: { type: "string" },
                                    taxId: { type: "string" },
                                    identificationNumber: { type: "string" },
                                    identificationType: { type: "string" },
                                    files: {
                                        type: "array",
                                        items: {
                                            type: "string",
                                            format: "binary",
                                            description: "Select 1 to 5 files."
                                        }
                                    },
                                    documentName: {
                                        type: "array",
                                        items: {
                                            type: "string",
                                            description: "Document names for each file, e.g. businessRegistration, vendorNIN"
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: "Seller registered successfully, pending admin verification" },
                    400: { description: "Validation failed or email not verified" }
                }
            }
        },
        "/api/sellers/apply": {
            post: {
                summary: "Apply for seller status (for existing users)",
                description: "Request should be multipart/form-data with files and document names.",
                tags: ["Sellers"],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                required: ["files"],
                                properties: {
                                    businessName: { type: "string" },
                                    taxId: { type: "string" },
                                    identificationNumber: { type: "string" },
                                    identificationType: { type: "string" },
                                    files: {
                                        type: "array",
                                        items: {
                                            type: "string",
                                            format: "binary",
                                            description: "Select 1 to 5 files."
                                        }
                                    },
                                    documentName: {
                                        type: "array",
                                        items: {
                                            type: "string",
                                            description: "Document names for each file, e.g. businessRegistration, vendorNIN"
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                responses: { 200: { description: "Application submitted" } }
            }
        },
        "/api/sellers/applications": {
            get: {
                summary: "Get seller applications (Admin only)",
                tags: ["Sellers"],
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: "List of applications" } }
            }
        },
        "/api/sellers/applications/{id}/verify": {
            patch: {
                summary: "Verify/Approve seller application",
                tags: ["Sellers"],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: "Seller verified" } }
            }
        },
        // ADDRESS ENDPOINTS (AddressRoutes.ts)
        "/api/addresses": {
            get: {
                summary: "Get all user addresses",
                tags: ["Addresses"],
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: "List of addresses" } }
            },
            post: {
                summary: "Create a new address",
                tags: ["Addresses"],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { type: "object", required: ["street", "city", "state", "country"], properties: { street: { type: "string" }, city: { type: "string" }, state: { type: "string" }, country: { type: "string" }, zipCode: { type: "string" }, isDefault: { type: "boolean" } } } } }
                },
                responses: { 201: { description: "Address created" } }
            }
        },
        "/api/addresses/default": {
            get: {
                summary: "Get default address",
                tags: ["Addresses"],
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: "Default address" } }
            }
        },
        "/api/addresses/{id}": {
            patch: {
                summary: "Update address",
                tags: ["Addresses"],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: "Address updated" } }
            },
            delete: {
                summary: "Delete address",
                tags: ["Addresses"],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: "Address deleted" } }
            }
        },
        // PROFILE ENDPOINTS (ProfileRoutes.ts)
        "/api/profile/me-profile": {
            get: {
                summary: "Get current user profile",
                tags: ["Profile"],
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: "User profile" } }
            }
        },
        "/api/profile": {
            post: {
                summary: "Create profile",
                tags: ["Profile"],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                properties: {
                                    firstName: { type: "string" },
                                    lastName: { type: "string" },
                                    phone: { type: "string" },
                                    files: {
                                        type: "array",
                                        items: {
                                            type: "string",
                                            format: "binary"
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                responses: { 201: { description: "Profile created" } }
            },
            get: {
                summary: "List all profiles (Admin)",
                tags: ["Profile"],
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: "List of profiles" } }
            },
            patch: {
                summary: "Update profile",
                tags: ["Profile"],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                properties: {
                                    firstName: { type: "string" },
                                    lastName: { type: "string" },
                                    phone: { type: "string" },
                                    files: {
                                        type: "array",
                                        items: {
                                            type: "string",
                                            format: "binary"
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                responses: { 200: { description: "Profile updated" } }
            }
        },
        "/api/profile/{id}": {
            get: {
                summary: "Get profile by ID",
                tags: ["Profile"],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: "Profile details" } }
            },
            delete: {
                summary: "Delete profile (Admin)",
                tags: ["Profile"],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: "Profile deleted" } }
            }
        },
        "/api/profile/reset-password": {
            post: {
                summary: "Reset password for authenticated user",
                tags: ["Profile"],
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: "Password reset" } }
            }
        },
        // ORDER ENDPOINTS (OrderRoutes.ts)
        "/api/orders": {
            post: {
                summary: "Create an order",
                tags: ["Orders"],
                security: [{ bearerAuth: [] }],
                responses: { 201: { description: "Order created" } }
            }
        },
        "/api/orders/my-orders": {
            get: {
                summary: "Get current user's orders",
                tags: ["Orders"],
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: "List of orders" } }
            }
        },
        "/api/orders/order-summary/{identifier}": {
            get: {
                summary: "Get order summary",
                tags: ["Orders"],
                parameters: [{ name: "identifier", in: "path", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "Order summary" } }
            }
        },
        "/api/orders/request/{requestNumber}": {
            get: {
                summary: "Get order by request number",
                tags: ["Orders"],
                parameters: [{ name: "requestNumber", in: "path", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "Order details" } }
            }
        },
        "/api/orders/{id}": {
            get: {
                summary: "Get order by ID",
                tags: ["Orders"],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: "Order details" } }
            },
            put: {
                summary: "Update order",
                tags: ["Orders"],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: "Order updated" } }
            },
            delete: {
                summary: "Delete order (Super Admin)",
                tags: ["Orders"],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: "Order deleted" } }
            }
        },
        "/api/orders/{id}/cancel": {
            post: {
                summary: "Cancel order",
                tags: ["Orders"],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "Order cancelled" } }
            }
        },
        "/api/orders/{id}/status": {
            put: {
                summary: "Update order status (Admin)",
                tags: ["Orders"],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["status"],
                                properties: {
                                    status: {
                                        type: "string",
                                        enum: ["PENDING", "CONFIRMED", "INSPECTION", "IN_TRANSIT", "CUSTOMS", "ARRIVED", "DELIVERED", "CANCELLED", "REFUNDED"]
                                    },
                                    note: { type: "string" }
                                }
                            }
                        }
                    }
                },
                responses: { 200: { description: "Status updated" } }
            }
        },
        "/api/orders/admin/all": {
            get: {
                summary: "Get all orders (Admin)",
                description: "Paginated, filterable list of all orders. Admin/Operations only.",
                tags: ["Orders"],
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "page", in: "query", schema: { type: "integer", default: 1 } },
                    { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
                    {
                        name: "status",
                        in: "query",
                        description: "Comma-separated or repeated statuses. e.g. status=PENDING&status=CONFIRMED",
                        schema: {
                            type: "array",
                            items: {
                                type: "string",
                                enum: ["PENDING", "CONFIRMED", "INSPECTION", "IN_TRANSIT", "CUSTOMS", "ARRIVED", "DELIVERED", "CANCELLED", "REFUNDED"]
                            }
                        }
                    },
                    { name: "userId", in: "query", schema: { type: "string" } },
                    { name: "search", in: "query", schema: { type: "string" }, description: "Search by request number, user name, or email" },
                    { name: "priority", in: "query", schema: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] } },
                    { name: "shippingMethod", in: "query", schema: { type: "string" } },
                    { name: "destinationCountry", in: "query", schema: { type: "string" } },
                    { name: "startDate", in: "query", schema: { type: "string", format: "date" }, description: "ISO date – filter orders created on or after this date" },
                    { name: "endDate", in: "query", schema: { type: "string", format: "date" }, description: "ISO date – filter orders created on or before this date" }
                ],
                responses: {
                    200: { description: "Paginated order list with user, vehicle, and payment details" },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden – admin only" }
                }
            }
        },
        "/api/orders/{id}/request-refund": {
            post: {
                summary: "Request a refund for an order",
                tags: ["Orders"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["reason"],
                                properties: {
                                    reason: { type: "string" }
                                }
                            }
                        }
                    }
                },
                responses: { 200: { description: "Refund requested" } }
            }
        },
        "/api/orders/{id}/notes": {
            get: {
                summary: "Get admin notes for an order",
                tags: ["Orders"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "List of notes" } }
            },
            post: {
                summary: "Add an admin note to an order",
                tags: ["Orders"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["content"],
                                properties: {
                                    content: { type: "string" },
                                    isInternal: { type: "boolean", default: true }
                                }
                            }
                        }
                    }
                },
                responses: { 201: { description: "Note added" } }
            }
        },
        "/api/orders/{id}/priority": {
            patch: {
                summary: "Update order priority (Admin)",
                tags: ["Orders"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["priority"],
                                properties: {
                                    priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] }
                                }
                            }
                        }
                    }
                },
                responses: { 200: { description: "Priority updated" } }
            }
        },
        "/api/orders/{id}/tags": {
            patch: {
                summary: "Update order tags",
                tags: ["Orders"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["tags"],
                                properties: {
                                    tags: { type: "array", items: { type: "string" } }
                                }
                            }
                        }
                    }
                },
                responses: { 200: { description: "Tags updated" } }
            }
        },
        "/api/orders/{id}/soft": {
            delete: {
                summary: "Soft-delete an order",
                tags: ["Orders"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "Order soft-deleted" } }
            }
        },
        "/api/orders/bulk/status": {
            patch: {
                summary: "Bulk update order statuses (Admin)",
                tags: ["Orders"],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["orderIds", "status"],
                                properties: {
                                    orderIds: { type: "array", items: { type: "string" } },
                                    status: { type: "string", enum: ["PENDING", "CONFIRMED", "INSPECTION", "IN_TRANSIT", "CUSTOMS", "ARRIVED", "DELIVERED", "CANCELLED", "REFUNDED"] }
                                }
                            }
                        }
                    }
                },
                responses: { 200: { description: "Statuses updated" } }
            }
        },
        "/api/orders/stats/status-counts": {
            get: {
                summary: "Get order counts grouped by status",
                tags: ["Orders"],
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: "Status count map" } }
            }
        },
        "/api/orders/stats/revenue": {
            get: {
                summary: "Get revenue statistics",
                tags: ["Orders"],
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "startDate", in: "query", schema: { type: "string", format: "date" } },
                    { name: "endDate", in: "query", schema: { type: "string", format: "date" } }
                ],
                responses: { 200: { description: "Revenue breakdown" } }
            }
        },
        // PAYMENT ENDPOINTS (PaymentRoutes.ts)
        "/api/payments/webhooks/paystack": {
            post: {
                summary: "Paystack payment webhook (no auth)",
                description: "Receives Paystack payment event callbacks. Verifies payment and updates order status to DEPOSIT_PAID or BALANCE_PAID.",
                tags: ["Payments"],
                requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
                responses: { 200: { description: "Webhook processed" } }
            }
        },
        "/api/payments/webhooks/stripe": {
            post: {
                summary: "Stripe payment webhook (no auth)",
                description: "Receives Stripe payment event callbacks. Verifies payment and updates order/payment status.",
                tags: ["Payments"],
                requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
                responses: { 200: { description: "Webhook processed" } }
            }
        },
        "/api/payments/init": {
            post: {
                summary: "Initiate online payment (Paystack / Stripe)",
                description: "Starts a payment session with the selected provider and creates a PENDING payment record. Use the returned checkout URL to redirect the buyer.",
                tags: ["Payments"],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["orderId", "provider", "callbackUrl"],
                                properties: {
                                    orderId: { type: "string" },
                                    provider: { type: "string", enum: ["stripe", "paystack", "flutterwave"] },
                                    callbackUrl: { type: "string", format: "uri" },
                                    paymentType: { type: "string", enum: ["DEPOSIT", "FULL_PAYMENT", "BALANCE"], default: "DEPOSIT" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: "Payment session created — contains checkout URL" },
                    400: { description: "Validation error or missing vehicle snapshot" },
                    404: { description: "Order not found" }
                }
            }
        },
        "/api/payments/verify/{reference}": {
            patch: {
                summary: "Verify online payment status",
                description: "Confirms the payment with the provider and marks it COMPLETED if successful.",
                tags: ["Payments"],
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "reference", in: "path", required: true, schema: { type: "string" } },
                    { name: "provider", in: "query", required: true, schema: { type: "string", enum: ["paystack", "stripe"] } }
                ],
                responses: {
                    200: { description: "Payment verified" },
                    400: { description: "Reference or provider missing" }
                }
            }
        },
        "/api/payments/user-mine": {
            get: {
                summary: "Get authenticated user's payments",
                tags: ["Payments"],
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: "List of payments for the current user" } }
            }
        },
        "/api/payments/all": {
            get: {
                summary: "Get all payments (authenticated)",
                description: "Returns all payments without pagination. For admin-filtered/paginated view use GET /api/payments/admin/list.",
                tags: ["Payments"],
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: "All payments with order details" } }
            }
        },
        "/api/payments/payment-id/{id}": {
            get: {
                summary: "Get payment by ID",
                tags: ["Payments"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    200: { description: "Payment details with order" },
                    404: { description: "Payment not found" }
                }
            }
        },
        // Bank transfer: one-shot order + payment creation
        "/api/payments/bank-transfer/initiate": {
            post: {
                summary: "Initiate bank transfer — create order + payment in one step",
                description: "Buyer clicks 'I have paid'. This single endpoint creates the order, creates a PENDING payment record, and attaches the bank transfer evidence simultaneously. Both order (PENDING_QUOTE) and payment (PROCESSING) are created and await admin confirmation. Use this instead of separately creating an order then uploading evidence.",
                tags: ["Payments"],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                required: ["identifier", "shippingMethod", "evidence"],
                                properties: {
                                    identifier: {
                                        type: "string",
                                        description: "Vehicle VIN or temp-id (e.g. temp-abc123)"
                                    },
                                    type: {
                                        type: "string",
                                        enum: ["id", "vin"],
                                        default: "id",
                                        description: "How to interpret the identifier"
                                    },
                                    vehicleId: {
                                        type: "string",
                                        description: "DB vehicle ID if known (optional)"
                                    },
                                    shippingMethod: {
                                        type: "string",
                                        enum: ["RORO", "CONTAINER", "AIR_FREIGHT", "EXPRESS"],
                                        description: "Chosen shipping method"
                                    },
                                    paymentType: {
                                        type: "string",
                                        enum: ["DEPOSIT", "FULL_PAYMENT"],
                                        default: "DEPOSIT",
                                        description: "Whether this is a deposit or full payment"
                                    },
                                    evidence: {
                                        type: "string",
                                        format: "binary",
                                        description: "Bank transfer receipt / proof of payment (image or PDF)"
                                    },
                                    customerNotes: { type: "string" },
                                    deliveryInstructions: { type: "string" },
                                    specialRequests: { type: "string" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: "Order and payment created — evidence attached, awaiting admin confirmation",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                order: {
                                                    type: "object",
                                                    properties: {
                                                        id: { type: "string" },
                                                        requestNumber: { type: "string" },
                                                        status: { type: "string", example: "PENDING_QUOTE" },
                                                        vehicleSnapshot: { type: "object" },
                                                        paymentBreakdown: { type: "object" }
                                                    }
                                                },
                                                payment: {
                                                    type: "object",
                                                    properties: {
                                                        id: { type: "string" },
                                                        status: { type: "string", example: "PROCESSING" },
                                                        amountUsd: { type: "number" },
                                                        paymentType: { type: "string" },
                                                        evidenceUrl: { type: "string", format: "uri" },
                                                        evidenceUploadedAt: { type: "string", format: "date-time" }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Missing required fields or no evidence file" },
                    401: { description: "Unauthorized" },
                    404: { description: "Vehicle not found" }
                }
            }
        },
        // Bank transfer evidence upload (existing order)
        "/api/payments/orders/{orderId}/evidence": {
            post: {
                summary: "Upload bank transfer evidence for an existing order",
                description: "Buyer re-uploads or adds proof of bank transfer to an already-created order. If no payment record exists for the order yet, one is created automatically. After upload the payment moves to PROCESSING and awaits admin confirmation. For a one-shot flow (no pre-existing order), use POST /api/payments/bank-transfer/initiate instead.",
                tags: ["Payments"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string" }, description: "Order ID to upload evidence for" }],
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                required: ["evidence"],
                                properties: {
                                    evidence: {
                                        type: "string",
                                        format: "binary",
                                        description: "Payment receipt / proof of transfer (image or PDF, max 5 MB)"
                                    },
                                    paymentType: {
                                        type: "string",
                                        enum: ["DEPOSIT", "FULL_PAYMENT", "BALANCE"],
                                        default: "DEPOSIT",
                                        description: "Type of payment being evidenced"
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Evidence uploaded — payment status set to PROCESSING, awaiting admin confirmation",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                id: { type: "string" },
                                                status: { type: "string", example: "PROCESSING" },
                                                evidenceUrl: { type: "string", format: "uri" },
                                                evidenceUploadedAt: { type: "string", format: "date-time" },
                                                amountUsd: { type: "number" },
                                                paymentType: { type: "string" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "No file uploaded or invalid order" },
                    403: { description: "Order does not belong to this user" },
                    404: { description: "Order not found" }
                }
            }
        },
        "/api/admin/payments/{id}/confirm": {
            patch: {
                summary: "Confirm bank transfer payment (Admin)",
                description: "Confirms the buyer's bank transfer evidence. Sets payment to COMPLETED and updates the order status to DEPOSIT_PAID or BALANCE_PAID based on payment type.",
                tags: ["Admin – Payments"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" }, description: "Payment ID" }],
                requestBody: {
                    required: false,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    note: { type: "string", description: "Optional confirmation note" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: "Payment confirmed — order status updated" },
                    400: { description: "Payment already confirmed" },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden – admin only" },
                    404: { description: "Payment not found" }
                }
            }
        },
        "/api/admin/payments/{id}/reject": {
            patch: {
                summary: "Reject bank transfer payment evidence (Admin)",
                description: "Rejects the uploaded evidence. Payment is reset to PENDING so the buyer can re-upload. A rejection reason (note) is required.",
                tags: ["Admin – Payments"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" }, description: "Payment ID" }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["note"],
                                properties: {
                                    note: { type: "string", description: "Reason for rejection (shown to buyer)" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: "Evidence rejected — payment reset to PENDING" },
                    400: { description: "note (rejection reason) is required, or payment is not rejectable" },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden – admin only" },
                    404: { description: "Payment not found" }
                }
            }
        },
        // SOURCING REQUEST ENDPOINTS (SourcingRequestRoutes.ts)
        "/api/sourcing-requests": {
            post: {
                summary: "Create a sourcing request (Find a Car)",
                tags: ["Sourcing Requests"],
                responses: { 201: { description: "Request created" } }
            },
            get: {
                summary: "List all sourcing requests (Admin)",
                tags: ["Sourcing Requests"],
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: "List of requests" } }
            }
        },
        "/api/sourcing-requests/{id}": {
            get: {
                summary: "Get sourcing request by ID (Admin)",
                tags: ["Sourcing Requests"],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: "Request details" } }
            }
        },
        // TESTIMONIAL ENDPOINTS (TestimonialRoutes.ts)
        "/api/testimonials": {
            post: {
                summary: "Create a testimonial",
                tags: ["Testimonials"],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                required: ["content", "rating"],
                                properties: {
                                    content: { type: "string" },
                                    rating: { type: "integer", minimum: 1, maximum: 5 },
                                    files: {
                                        type: "array",
                                        items: {
                                            type: "string",
                                            format: "binary"
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                responses: { 201: { description: "Testimonial created" } }
            },
            patch: {
                summary: "Approve testimonial (Admin)",
                tags: ["Testimonials"],
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: "Testimonial approved" } }
            }
        },
        "/api/testimonials/{id}": {
            get: {
                summary: "Get testimonials",
                tags: ["Testimonials"],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: "List of testimonials" } }
            }
        },
        // ── ADMIN MODULE (/api/admin) ──────────────────────────────────────────
        // Admin – Dashboard
        "/api/admin/dashboard/stats": {
            get: {
                summary: "Admin dashboard statistics",
                description: "Returns Total Users, Total Cars (API vs Manual), Total Orders (with pending count), and Total Revenue with month-over-month change.",
                tags: ["Admin – Dashboard"],
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: "Dashboard stats",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        totalUsers: { type: "integer" },
                                        totalCars: { type: "integer" },
                                        carBreakdown: {
                                            type: "object",
                                            properties: {
                                                api: { type: "integer" },
                                                manual: { type: "integer" }
                                            }
                                        },
                                        totalOrders: { type: "integer" },
                                        pendingOrdersCount: { type: "integer" },
                                        totalRevenue: { type: "number" },
                                        revenueThisMonth: { type: "number" },
                                        revenueLastMonth: { type: "number" },
                                        revenueChangePercent: { type: "number", nullable: true }
                                    }
                                }
                            }
                        }
                    },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden – admin only" }
                }
            }
        },
        "/api/admin/dashboard/pending-orders": {
            get: {
                summary: "Paginated list of pending orders",
                tags: ["Admin – Dashboard"],
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "page", in: "query", schema: { type: "integer", default: 1 } },
                    { name: "limit", in: "query", schema: { type: "integer", default: 10, maximum: 50 } }
                ],
                responses: {
                    200: { description: "Paginated pending orders with user and vehicle details" },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden – admin only" }
                }
            }
        },
        "/api/admin/dashboard/recent-activity": {
            get: {
                summary: "Recent system activity feed",
                tags: ["Admin – Dashboard"],
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 50 } }
                ],
                responses: {
                    200: { description: "List of recent activity log entries with user info" },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden – admin only" }
                }
            }
        },
        // Admin – Users
        "/api/admin/users": {
            get: {
                summary: "List all users (paginated)",
                tags: ["Admin – Users"],
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "page", in: "query", schema: { type: "integer", default: 1 } },
                    { name: "limit", in: "query", schema: { type: "integer", default: 10 } }
                ],
                responses: {
                    200: { description: "Paginated user list" },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden – admin only" }
                }
            }
        },
        "/api/admin/users/create": {
            post: {
                summary: "Create a new user account (admin)",
                description: "Creates a user with emailVerified=true, generates a secure random password, sends credentials + password-reset token to the user's email.",
                tags: ["Admin – Users"],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["firstName", "lastName", "email"],
                                properties: {
                                    firstName: { type: "string" },
                                    lastName: { type: "string" },
                                    email: { type: "string", format: "email" },
                                    phone: { type: "string" },
                                    role: {
                                        type: "string",
                                        enum: ["BUYER", "SELLER", "OPERATIONS_ADMIN", "SUPER_ADMIN"],
                                        default: "BUYER"
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: "User created and credentials emailed" },
                    400: { description: "Validation error" },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden – admin only" },
                    409: { description: "Email already in use" }
                }
            }
        },
        "/api/admin/users/{userId}": {
            get: {
                summary: "Get user by ID",
                tags: ["Admin – Users"],
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "userId", in: "path", required: true, schema: { type: "string" } }
                ],
                responses: {
                    200: { description: "User details" },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden" },
                    404: { description: "User not found" }
                }
            },
            delete: {
                summary: "Deactivate a user account",
                tags: ["Admin – Users"],
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "userId", in: "path", required: true, schema: { type: "string" } }
                ],
                responses: {
                    200: { description: "Account deactivated" },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden – admin only" },
                    404: { description: "User not found" }
                }
            }
        },
        // Admin – Payments
        "/api/admin/payments/stats": {
            get: {
                summary: "Payment statistics for admin dashboard",
                description: "Returns Total Transactions, Total Revenue, Pending count, and Total Refunded.",
                tags: ["Admin – Payments"],
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: "Payment stats",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        totalTransactions: { type: "integer" },
                                        totalRevenue: { type: "number" },
                                        pendingCount: { type: "integer" },
                                        totalRefunded: { type: "number" }
                                    }
                                }
                            }
                        }
                    },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden – admin only" }
                }
            }
        },
        "/api/admin/payments": {
            get: {
                summary: "Paginated admin payments list",
                description: "Supports filtering by status and full-text search on transaction reference or order ID.",
                tags: ["Admin – Payments"],
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "page", in: "query", schema: { type: "integer", default: 1 } },
                    { name: "limit", in: "query", schema: { type: "integer", default: 10, maximum: 100 } },
                    {
                        name: "status",
                        in: "query",
                        schema: {
                            type: "string",
                            enum: ["ALL", "PENDING", "COMPLETED", "FAILED", "REFUNDED"]
                        }
                    },
                    { name: "search", in: "query", schema: { type: "string" }, description: "Search by transaction reference or order ID" }
                ],
                responses: {
                    200: { description: "Paginated payments with user and order details" },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden – admin only" }
                }
            }
        },
        "/api/admin/payments/{id}": {
            get: {
                summary: "Get a single payment by ID",
                tags: ["Admin – Payments"],
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string" } }
                ],
                responses: {
                    200: { description: "Payment details with related order" },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden – admin only" },
                    404: { description: "Payment not found" }
                }
            }
        },
        // Admin – Notifications
        "/api/admin/notifications/stats": {
            get: {
                summary: "Admin notification statistics",
                description: "Returns Total Sent, Delivered (read), Pending (unread), and Order Alerts count.",
                tags: ["Admin – Notifications"],
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: "Notification stats",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        totalSent: { type: "integer" },
                                        delivered: { type: "integer" },
                                        pending: { type: "integer" },
                                        orderAlerts: { type: "integer" }
                                    }
                                }
                            }
                        }
                    },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden – admin only" }
                }
            }
        },
        "/api/admin/notifications": {
            get: {
                summary: "Paginated admin notification list",
                description: "Filter by notification type (All Types) and status (All Status / Pending / Completed). Automatically scoped to admin users.",
                tags: ["Admin – Notifications"],
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "page", in: "query", schema: { type: "integer", default: 1 } },
                    { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
                    {
                        name: "type",
                        in: "query",
                        description: "Filter by notification type",
                        schema: {
                            type: "string",
                            enum: [
                                "ALL",
                                "ORDER_CREATED",
                                "ORDER_STATUS_CHANGED",
                                "PAYMENT_RECEIVED",
                                "PAYMENT_FAILED",
                                "INSPECTION_COMPLETE",
                                "SHIPMENT_UPDATE",
                                "DELIVERY_SCHEDULED",
                                "ORDER_DELIVERED",
                                "REFUND_PROCESSED",
                                "QUOTE_EXPIRED",
                                "SYSTEM_ALERT"
                            ]
                        }
                    },
                    {
                        name: "status",
                        in: "query",
                        description: "all (default) | pending (unread) | completed (read)",
                        schema: { type: "string", enum: ["all", "pending", "completed"] }
                    }
                ],
                responses: {
                    200: { description: "Paginated notification list with recipientEmail field" },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden – admin only" }
                }
            }
        },
        "/api/admin/notifications/mark-all-read": {
            patch: {
                summary: "Mark all admin notifications as read",
                tags: ["Admin – Notifications"],
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: "All notifications marked as read" },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden – admin only" }
                }
            }
        },
        "/api/admin/notifications/{id}/read": {
            patch: {
                summary: "Mark a single notification as read",
                tags: ["Admin – Notifications"],
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string" } }
                ],
                responses: {
                    200: { description: "Notification marked as read" },
                    400: { description: "Notification ID required" },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden – admin only" }
                }
            }
        },
        // Also document the legacy /api/users/admin/create route
        "/api/users/admin/create": {
            post: {
                summary: "Create user account (admin) — legacy route",
                description: "Same as POST /api/admin/users/create. Kept for backwards compatibility.",
                tags: ["Admin – Users"],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["firstName", "lastName", "email"],
                                properties: {
                                    firstName: { type: "string" },
                                    lastName: { type: "string" },
                                    email: { type: "string", format: "email" },
                                    phone: { type: "string" },
                                    role: { type: "string", enum: ["BUYER", "SELLER", "OPERATIONS_ADMIN", "SUPER_ADMIN"] }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: "User created" },
                    409: { description: "Email already in use" }
                }
            }
        },
        // ── PAYOUT ENDPOINTS (/api/payout) ────────────────────────────────────────
        "/api/payout/webhooks/transfer": {
            post: {
                summary: "Paystack transfer webhook (no auth)",
                description: "Receives Paystack transfer event notifications. Validates HMAC-SHA512 signature from x-paystack-signature header. Handles transfer.success, transfer.failed, transfer.reversed.",
                tags: ["Payout"],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { type: "object" } } }
                },
                responses: {
                    200: { description: "Webhook processed" },
                    401: { description: "Invalid signature" }
                }
            }
        },
        "/api/payout/balance": {
            get: {
                summary: "Get wallet balance",
                description: "Returns wallet balance in USD, equivalent NGN, current exchange rate, and whether a payout PIN is set.",
                tags: ["Payout"],
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: "Wallet balance",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                walletBalance: { type: "number" },
                                                currency: { type: "string", example: "USD" },
                                                equivalentNgn: { type: "number" },
                                                exchangeRate: { type: "number" },
                                                pinSet: { type: "boolean" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/payout/pin/setup": {
            post: {
                summary: "Set up payout PIN",
                description: "Sets a 4–6 digit numeric payout PIN. Can only be called once — use /pin/change to update.",
                tags: ["Payout"],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["pin"],
                                properties: {
                                    pin: { type: "string", pattern: "^\\d{4,6}$", example: "1234" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: "PIN set successfully" },
                    409: { description: "PIN already set" }
                }
            }
        },
        "/api/payout/pin/change": {
            patch: {
                summary: "Change payout PIN",
                description: "Updates the payout PIN. Requires the current PIN for verification.",
                tags: ["Payout"],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["oldPin", "newPin"],
                                properties: {
                                    oldPin: { type: "string", pattern: "^\\d{4,6}$" },
                                    newPin: { type: "string", pattern: "^\\d{4,6}$" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: "PIN updated" },
                    403: { description: "Current PIN incorrect" }
                }
            }
        },
        "/api/payout/banks": {
            get: {
                summary: "List Nigerian banks",
                description: "Returns list of supported banks from Paystack (name, code, slug).",
                tags: ["Payout"],
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: "List of banks" }
                }
            }
        },
        "/api/payout/banks/verify": {
            post: {
                summary: "Verify bank account number",
                description: "Verifies an account number against a bank code via Paystack. Returns the account name.",
                tags: ["Payout"],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["accountNumber", "bankCode"],
                                properties: {
                                    accountNumber: { type: "string", example: "0000000000" },
                                    bankCode: { type: "string", example: "044" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Account verified",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                account_name: { type: "string" },
                                                account_number: { type: "string" },
                                                bank_id: { type: "integer" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Invalid account number or bank code" }
                }
            }
        },
        "/api/payout/bank-accounts": {
            post: {
                summary: "Add a bank account",
                description: "Verifies the account with Paystack, creates a transfer recipient, and saves it. First account is auto-set as default.",
                tags: ["Payout"],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["bankName", "bankCode", "accountNumber"],
                                properties: {
                                    bankName: { type: "string", example: "Access Bank" },
                                    bankCode: { type: "string", example: "044" },
                                    accountNumber: { type: "string", example: "0000000000" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: "Bank account added" },
                    409: { description: "Account already registered" }
                }
            },
            get: {
                summary: "List bank accounts",
                description: "Returns all active bank accounts for the authenticated user.",
                tags: ["Payout"],
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: "List of bank accounts" }
                }
            }
        },
        "/api/payout/bank-accounts/{id}/default": {
            patch: {
                summary: "Set default bank account",
                tags: ["Payout"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    200: { description: "Default account updated" },
                    404: { description: "Bank account not found" }
                }
            }
        },
        "/api/payout/bank-accounts/{id}": {
            delete: {
                summary: "Remove a bank account",
                description: "Soft-deletes (deactivates) the bank account.",
                tags: ["Payout"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    200: { description: "Bank account removed" },
                    404: { description: "Bank account not found" }
                }
            }
        },
        "/api/payout/withdraw": {
            post: {
                summary: "Initiate a withdrawal",
                description: "Verifies PIN, checks wallet balance, converts USD→NGN at live rate, deducts wallet, and initiates a Paystack transfer. Wallet is restored automatically on failure or reversal via webhook.",
                tags: ["Payout"],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["bankAccountId", "amountUsd", "pin"],
                                properties: {
                                    bankAccountId: { type: "string" },
                                    amountUsd: { type: "number", minimum: 10, example: 50 },
                                    pin: { type: "string", pattern: "^\\d{4,6}$" },
                                    note: { type: "string", example: "Monthly payout" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Withdrawal initiated",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                message: { type: "string" },
                                                reference: { type: "string" },
                                                amountUsd: { type: "number" },
                                                amountNgn: { type: "number" },
                                                exchangeRate: { type: "number" },
                                                status: { type: "string", example: "PROCESSING" },
                                                bankAccount: {
                                                    type: "object",
                                                    properties: {
                                                        bankName: { type: "string" },
                                                        accountNumber: { type: "string" },
                                                        accountName: { type: "string" }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Insufficient balance or invalid amount" },
                    403: { description: "Invalid PIN" }
                }
            }
        },
        "/api/payout/withdrawals": {
            get: {
                summary: "Get withdrawal history",
                description: "Paginated list of withdrawal requests for the authenticated user.",
                tags: ["Payout"],
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "page", in: "query", schema: { type: "integer", default: 1 } },
                    { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } }
                ],
                responses: {
                    200: {
                        description: "Paginated withdrawal history",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        withdrawals: { type: "array", items: { type: "object" } },
                                        total: { type: "integer" },
                                        page: { type: "integer" },
                                        limit: { type: "integer" },
                                        pages: { type: "integer" }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        // SELLER VEHICLE ENDPOINTS (SellerVehicleRoutes.ts)
        "/api/seller-vehicles/submit": {
            post: {
                summary: "Submit a vehicle listing (Seller or Admin)",
                description: `Submit a vehicle listing. Accessible by **verified sellers** and **admins** (OPERATIONS_ADMIN / SUPER_ADMIN).

- **Seller** submissions: status is set to \`PENDING_REVIEW\` and await admin approval.
- **Admin** submissions: status is set to \`AVAILABLE\` immediately — no review step needed.

Send as **multipart/form-data** so images can be included.

**Array fields** (titleStatus, knownIssues, features, highlights) accept either a JSON string (\`["Clean title"]\`) or a plain string for a single value.

**condition** is case-insensitive — \`good\` is accepted and converted to \`GOOD\`.`,
                tags: ["Seller Vehicles"],
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                required: [
                                    "year", "make", "model", "mileage",
                                    "condition", "titleStatus", "accidentHistory",
                                    "askingPrice",
                                    "contactFirstName", "contactLastName", "contactEmail", "contactPhone",
                                    "city", "zipCode"
                                ],
                                properties: {
                                    // ── Step 1: Vehicle Details ─────────────────────────────
                                    year: { type: "integer", example: 2020, description: "Model year (1900 – current+1)" },
                                    make: { type: "string", example: "Toyota" },
                                    model: { type: "string", example: "Camry" },
                                    vehicleType: {
                                        type: "string",
                                        enum: ["CAR", "SUV", "TRUCK", "VAN", "COUPE", "SEDAN", "HATCHBACK", "WAGON", "CONVERTIBLE", "MOTORCYCLE", "OTHER"],
                                        default: "OTHER",
                                        description: "Defaults to OTHER if omitted"
                                    },
                                    trim: { type: "string", example: "XSE", description: "Optional trim level" },
                                    bodyStyle: { type: "string", example: "Sedan" },
                                    mileage: { type: "integer", example: 45000 },
                                    vin: { type: "string", example: "1HGCM82633A123456", description: "Leave blank — a placeholder is generated automatically" },
                                    transmission: { type: "string", example: "Automatic" },
                                    drivetrain: { type: "string", example: "FWD", description: "AWD / FWD / RWD" },
                                    fuelType: { type: "string", example: "Petrol" },
                                    exteriorColor: { type: "string", example: "Silver" },
                                    cylinders: { type: "integer", example: 4 },
                                    // ── Step 2: Condition ────────────────────────────────────
                                    condition: {
                                        type: "string",
                                        enum: ["EXCELLENT", "GOOD", "FAIR", "BAD"],
                                        example: "GOOD",
                                        description: "Case-insensitive — 'good' is accepted"
                                    },
                                    titleStatus: {
                                        type: "string",
                                        example: "Clean title",
                                        description: "One value as a plain string, or a JSON array: '[\"Clean title\",\"Lien free\"]'"
                                    },
                                    accidentHistory: {
                                        type: "string",
                                        example: "No accidents",
                                        description: "e.g. No accidents / Minor accident / Major accident / Unknown"
                                    },
                                    knownIssues: {
                                        type: "string",
                                        example: "Engine ticking",
                                        description: "Plain string or JSON array. Omit if none."
                                    },
                                    keys: { type: "integer", example: 2 },
                                    features: {
                                        type: "string",
                                        example: "Sunroof",
                                        description: "Plain string or JSON array: '[\"Sunroof\",\"Leather seats\"]'"
                                    },
                                    highlights: {
                                        type: "string",
                                        example: "New brakes installed 2024",
                                        description: "Major repairs / highlights. Plain string or JSON array."
                                    },
                                    modifications: { type: "string", example: "Aftermarket exhaust" },
                                    // ── Step 3: Photos & Price ───────────────────────────────
                                    files: {
                                        type: "array",
                                        items: { type: "string", format: "binary" },
                                        description: "Vehicle images / videos (up to 10 files)"
                                    },
                                    askingPrice: { type: "number", example: 18500, description: "Asking price in USD" },
                                    showAskingPrice: { type: "boolean", example: true, default: true },
                                    allowOffers: { type: "boolean", example: true, default: true },
                                    additionalNotes: { type: "string", example: "Will consider reasonable offers" },
                                    // ── Step 4: Contact Details ──────────────────────────────
                                    contactFirstName: { type: "string", example: "John" },
                                    contactLastName: { type: "string", example: "Doe" },
                                    contactEmail: { type: "string", format: "email", example: "john@example.com" },
                                    contactPhone: { type: "string", example: "+2348012345678" },
                                    city: { type: "string", example: "Lagos" },
                                    zipCode: { type: "string", example: "100001" },
                                    preferredContact: { type: "string", enum: ["Email", "Phone", "SMS"] },
                                    bestTimeToReach: { type: "string", example: "Morning" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: "Seller: listing submitted and pending review. Admin: listing published immediately as AVAILABLE." },
                    400: { description: "Validation error — see details array" },
                    403: { description: "User is not a verified seller (admins bypass this check)" }
                }
            }
        },
        "/api/seller-vehicles": {
            get: {
                summary: "List all seller vehicle listings (Admin)",
                tags: ["Seller Vehicles"],
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: "List of listings" } }
            }
        },
        "/api/seller-vehicles/{id}": {
            get: {
                summary: "Get seller vehicle listing by ID",
                tags: ["Seller Vehicles"],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: "Listing details" } }
            },
            delete: {
                summary: "Delete listing",
                tags: ["Seller Vehicles"],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: "Listing deleted" } }
            }
        },
        "/api/seller-vehicles/{id}/status": {
            patch: {
                summary: "Update listing status (Admin)",
                tags: ["Seller Vehicles"],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: "Status updated" } }
            }
        },
        // ── Platform Bank Accounts ──────────────────────────────────────────────
        "/api/platform-bank-accounts": {
            get: {
                summary: "List active platform bank accounts",
                description: "Returns all active bank accounts Afronxon uses to receive manual (bank transfer) payments. No authentication required — shown to buyers on the payment page.",
                tags: ["Platform Bank Accounts"],
                security: [],
                responses: {
                    200: {
                        description: "Active bank accounts",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                data: {
                                                    type: "array",
                                                    items: { $ref: "#/components/schemas/PlatformBankAccount" }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            post: {
                summary: "Create a platform bank account (Admin)",
                description: "Add a new bank account to the manual payment listing.",
                tags: ["Platform Bank Accounts"],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/CreatePlatformBankAccountInput" }
                        }
                    }
                },
                responses: {
                    201: { description: "Bank account created" },
                    400: { description: "Validation error" },
                    403: { description: "Admin access required" }
                }
            }
        },
        "/api/platform-bank-accounts/by-currency/{currency}": {
            get: {
                summary: "List active bank accounts by currency",
                description: "Returns active platform bank accounts filtered by currency. Primary account is listed first.",
                tags: ["Platform Bank Accounts"],
                security: [],
                parameters: [
                    {
                        name: "currency",
                        in: "path",
                        required: true,
                        schema: { type: "string", enum: ["USD", "NGN", "GBP", "EUR", "GHS", "KES", "ZAR"] },
                        description: "Currency code"
                    }
                ],
                responses: {
                    200: { description: "Filtered bank accounts" },
                    400: { description: "Invalid currency" }
                }
            }
        },
        "/api/platform-bank-accounts/admin/all": {
            get: {
                summary: "List all platform bank accounts including inactive (Admin)",
                tags: ["Platform Bank Accounts"],
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: "All bank accounts" },
                    403: { description: "Admin access required" }
                }
            }
        },
        "/api/platform-bank-accounts/{id}": {
            patch: {
                summary: "Update a platform bank account (Admin)",
                tags: ["Platform Bank Accounts"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/UpdatePlatformBankAccountInput" }
                        }
                    }
                },
                responses: {
                    200: { description: "Bank account updated" },
                    404: { description: "Bank account not found" },
                    403: { description: "Admin access required" }
                }
            },
            delete: {
                summary: "Delete a platform bank account (Admin)",
                tags: ["Platform Bank Accounts"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    200: { description: "Bank account deleted" },
                    404: { description: "Bank account not found" },
                    403: { description: "Admin access required" }
                }
            }
        },
        "/api/platform-bank-accounts/{id}/set-primary": {
            patch: {
                summary: "Set bank account as primary for its currency (Admin)",
                description: "Marks this account as primary and demotes any other primary in the same currency.",
                tags: ["Platform Bank Accounts"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    200: { description: "Primary account updated" },
                    404: { description: "Bank account not found" },
                    403: { description: "Admin access required" }
                }
            }
        },
        "/api/platform-bank-accounts/{id}/toggle": {
            patch: {
                summary: "Toggle bank account active/inactive (Admin)",
                tags: ["Platform Bank Accounts"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    200: { description: "Active status toggled" },
                    404: { description: "Bank account not found" },
                    403: { description: "Admin access required" }
                }
            }
        },
    },
};
exports.default = swaggerSpec;
