import { Request, Response, NextFunction } from "express";

interface RequestLimits {
  [key: string]: {
    count: number;
    timestamp: number;
  };
}

const requestLimits: RequestLimits = {};

/**
 * Middleware to limit the number of requests per IP address within a time window.
 * @param maxRequests - Maximum number of requests allowed.
 * @param windowMs - Time window in milliseconds.
 * @returns An Express middleware function for rate limiting.
 */
export const rateLimit = (maxRequests: number, windowMs: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Extract IP address; fallback if req.ip is undefined
    const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";

    if (typeof ip !== "string") {
      res.status(500).json({ message: "Unable to determine IP address." });
      return;
    }

    const currentTime = Date.now();

    // Initialize request limits for new IPs
    if (!requestLimits[ip]) {
      requestLimits[ip] = { count: 1, timestamp: currentTime };
    } else {
      const timeDifference = currentTime - requestLimits[ip].timestamp;

      // Check if within the time window
      if (timeDifference < windowMs) {
        requestLimits[ip].count += 1;

        if (requestLimits[ip].count > maxRequests) {
          res.status(429).json({ message: "Too many requests. Please try again later." });
          return;
        }
      } else {
        // Reset the count and timestamp if outside the time window
        requestLimits[ip] = { count: 1, timestamp: currentTime };
      }
    }

    next(); // Proceed to the next middleware or route
  };
};
