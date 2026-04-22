import type { Request, Response, NextFunction } from 'express';
import { validate } from 'class-validator';
import { plainToInstance, ClassConstructor } from 'class-transformer';

export function validateDTO<T extends object>(DTOClass: ClassConstructor<T>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const instance = plainToInstance(DTOClass, req.body);
    const errors = await validate(instance, {
      whitelist: true,         // strip unknown fields
      forbidNonWhitelisted: false,
      stopAtFirstError: false,
    });

    if (errors.length > 0) {
      const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
      res.status(400).json({ message: messages[0], errors: messages });
      return;
    }

    req.body = instance;
    next();
  };
}
