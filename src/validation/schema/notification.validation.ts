import Joi from 'joi';
import { NotificationType } from '../../generated/prisma/client';


export const createNotificationSchema = Joi.object({
  userId: Joi.string().required(),
  orderId: Joi.string().optional(),

  type: Joi.string()
    .valid(...Object.values(NotificationType))
    .required(),

  title: Joi.string().required(),
  message: Joi.string().required(),

  actionUrl: Joi.string().optional(),
  actionLabel: Joi.string().optional(),
});
