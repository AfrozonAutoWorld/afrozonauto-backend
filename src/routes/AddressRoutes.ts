import { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { AddressController } from '../controllers/AddressController';
import { createAddressSchema} from "../validation/schema/address.validation"
import { validateBody } from '../middleware/bodyValidate';
import { authenticate } from '../middleware/authMiddleware';
import { valid } from 'joi/lib';
class AddressRoutes {
  private router: Router;
  private controller: AddressController;

  constructor() {
    this.router = Router();
    this.controller = container.get<AddressController>(TYPES.AddressController);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {

    this.router.post('/', authenticate, validateBody(createAddressSchema), this.controller.createAddress);
    this.router.get('/', authenticate, this.controller.getUserAddresses);
    this.router.get('/default', authenticate, this.controller.getDefaultAddress);
    this.router.patch('/:id', authenticate, validateBody(createAddressSchema), this.controller.updateAddress);
    this.router.delete('/:id', authenticate, this.controller.deleteAddress);
  }

  public getRouter(): Router {
    return this.router;
  }
}

export default new AddressRoutes().getRouter();
