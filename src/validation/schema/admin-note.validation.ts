import Joi from 'joi';

export const createAdminNoteSchema = Joi.object({
    orderId: Joi.string().optional(),
    userId: Joi.string().optional(),

    note: Joi.string().required(),

    isInternal: Joi.boolean().optional(),
    category: Joi.string().optional(),
});
