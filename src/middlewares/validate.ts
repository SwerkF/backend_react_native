import { Request, Response, NextFunction } from "express";
import { ObjectSchema } from "joi";

/**
 * Middleware to validate request data using Joi schema.
 * @param schema - Joi schema to validate against.
 * @param property - Property of the request to validate (body, query, or params).
 * @returns Express middleware that validates the request.
 */
export const validate =
  (schema: ObjectSchema, property: "body" | "query" | "params") =>
  (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req[property], { abortEarly: false });

    if (error) {
      const validationErrors = error.details.map((err) => err.message);
      res.status(400).json({
        message: "Invalid data.",
        errors: validationErrors,
      });
      return;
    }

    next(); // Proceed to the next middleware or controller
  };
