import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';



export const validateBody = (schema: Schema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // use validateAsync to support .external() async rules
      const value = await schema.validateAsync(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      req.body = value;
      next();
    } catch (error: any) {
      if (error.isJoi) {
        const details = error.details?.map((d: any) => ({
          field: d.context?.key,
          message: d.message.replace(/["]/g, ''),
        }));
        return res.status(400).json({
          error: 'Validation failed',
          details,
        });
      }
      next(error);
    }
  };
};

