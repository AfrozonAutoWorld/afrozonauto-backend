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
          data: {
            type: "object"
          }
        }
      }
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
        summary: "Update vehicle",
        tags: ["Vehicles"],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Vehicle updated" } }
      },
      delete: {
        summary: "Delete vehicle",
        tags: ["Vehicles"],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Vehicle deleted" } }
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
        responses: { 200: { description: "Status updated" } }
      }
    },

    // PAYMENT ENDPOINTS (PaymentRoutes.ts)
    "/api/payments/init": {
      post: {
        summary: "Initiate payment",
        tags: ["Payments"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["orderId", "provider", "callbackUrl"], properties: { orderId: { type: "string" }, provider: { type: "string", enum: ["stripe", "paystack", "flutterwave"] }, callbackUrl: { type: "string" }, paymentType: { type: "string" } } } } }
        },
        responses: { 201: { description: "Payment initiated" } }
      }
    },
    "/api/payments/verify/{reference}": {
      patch: {
        summary: "Verify payment",
        tags: ["Payments"],
        parameters: [{ name: "reference", in: "path", required: true, schema: { type: "string" } }],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Payment verified" } }
      }
    },
    "/api/payments/user-mine": {
      get: {
        summary: "Get current user's payments",
        tags: ["Payments"],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "List of payments" } }
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
          { name: "page",  in: "query", schema: { type: "integer", default: 1 } },
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
          { name: "page",  in: "query", schema: { type: "integer", default: 1 } },
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
                  lastName:  { type: "string" },
                  email:     { type: "string", format: "email" },
                  phone:     { type: "string" },
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
                    totalRevenue:      { type: "number" },
                    pendingCount:      { type: "integer" },
                    totalRefunded:     { type: "number" }
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
          { name: "page",   in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit",  in: "query", schema: { type: "integer", default: 10, maximum: 100 } },
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
                    totalSent:   { type: "integer" },
                    delivered:   { type: "integer" },
                    pending:     { type: "integer" },
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
          { name: "page",   in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit",  in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
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
                  lastName:  { type: "string" },
                  email:     { type: "string", format: "email" },
                  phone:     { type: "string" },
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

    // SELLER VEHICLE ENDPOINTS (SellerVehicleRoutes.ts)
    "/api/seller-vehicles/submit": {
      post: {
        summary: "Submit a vehicle listing for sale",
        tags: ["Seller Vehicles"],
        responses: { 201: { description: "Listing submitted" } }
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
  },
};

export default swaggerSpec;
