import { Request, Response, NextFunction } from "express";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    [key: string]: any;
  };
}

/**
 * Middleware to verify if the user has access rights to the requested resource.
 * @param allowedRoles - Array of roles that bypass access restrictions (e.g., ["admin"]).
 */
export const verifyAccess =
  (allowedRoles: string[] = []) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: "Unauthorized: User not authenticated." });
      return;
    }

    console.log(user.role);
    console.log(allowedRoles);

    if (!user.role || !allowedRoles.some(roleGroup => roleGroup.includes(user.role))) {
      res.status(403).json({ message: "Forbidden: You do not have access to this resource." });
      return;
    }

    next();
  };
