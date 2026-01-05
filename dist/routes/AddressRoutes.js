"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inversify_config_1 = require("../config/inversify.config");
const types_1 = require("../config/types");
const address_validation_1 = require("../validation/schema/address.validation");
const bodyValidate_1 = require("../middleware/bodyValidate");
const authMiddleware_1 = require("../middleware/authMiddleware");
class AddressRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.controller = inversify_config_1.container.get(types_1.TYPES.AddressController);
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.post('/', authMiddleware_1.authenticate, (0, bodyValidate_1.validateBody)(address_validation_1.createAddressSchema), this.controller.createAddress);
        this.router.get('/', authMiddleware_1.authenticate, this.controller.getUserAddresses);
        this.router.get('/default', authMiddleware_1.authenticate, this.controller.getDefaultAddress);
        this.router.patch('/:id', authMiddleware_1.authenticate, (0, bodyValidate_1.validateBody)(address_validation_1.createAddressSchema), this.controller.updateAddress);
        this.router.delete('/:id', authMiddleware_1.authenticate, this.controller.deleteAddress);
    }
    getRouter() {
        return this.router;
    }
}
exports.default = new AddressRoutes().getRouter();
