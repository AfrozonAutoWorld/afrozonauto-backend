import Joi from 'joi';

export const createTokenSchema = Joi.object({
    userId: Joi.string().optional(),
    email: Joi.string().email().optional(),  
    token: Joi.number().integer().required(),
  });
  