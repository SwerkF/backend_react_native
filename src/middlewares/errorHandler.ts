import { Request, Response, NextFunction } from "express";

/**
 * Global error handling middleware.
 * @param err - The error object.
 * @param req - The incoming request.
 * @param res - The outgoing response.
 * @param next - The next middleware in the pipeline.
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err); // Log the error for debugging purposes
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
};
