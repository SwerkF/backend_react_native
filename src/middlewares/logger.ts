import { Request, Response, NextFunction } from "express";

/**
 * Middleware to log incoming requests.
 * @param req - The incoming request.
 * @param res - The outgoing response.
 * @param next - The next middleware in the pipeline.
 */
export const logger = (req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
};
