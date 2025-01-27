import { Request, Response, NextFunction } from "express";
const jwt = require("jsonwebtoken");

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: string;
        [key: string]: any; // Étendre si nécessaire
    };
}

export const isAuthenticated = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).json({ message: "Token manquant." });
        return;
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as AuthenticatedRequest["user"];
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: "Token invalide ou expiré." });
    }
};

export const hasToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        next();
    } else {
        const token = authHeader.split(" ")[1];

        try {
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as AuthenticatedRequest["user"];
            req.user = decoded; // Attacher l'utilisateur décodé à req.user
            next();
        } catch (error) {
            next();
        }
    }

  
}