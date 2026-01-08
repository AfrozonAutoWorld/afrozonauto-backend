"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
class ApiResponse {
    constructor(statusCode, data, message = 'Success', meta) {
        this.success = statusCode < 400;
        this.message = message;
        this.data = { data, meta };
        this.timestamp = new Date();
    }
    // Helper method for success responses
    static success(data, message = 'Success', meta) {
        return new ApiResponse(200, data, message, meta);
    }
    // Helper method for created responses
    static created(data, message = 'Created successfully') {
        return new ApiResponse(201, data, message);
    }
    // Helper method for paginated responses
    static paginated(data, meta, message = 'Data retrieved successfully') {
        return new ApiResponse(200, data, message, meta);
    }
}
exports.ApiResponse = ApiResponse;
