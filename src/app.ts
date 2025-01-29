import express, { Application, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import connect from "@/config/conn"; // Alias @/ fonctionne ici
import { rateLimit } from "@/middlewares/rateLimit";
import { errorHandler } from "@/middlewares/errorHandler";
import { logger } from "@/middlewares/logger";
import http from 'http';
import { WebSocketManager } from './websocket/WebSocketManager';


dotenv.config();

const app: Application = express();
const server = http.createServer(app);

// Middlewares globaux
app.use(cors());
app.use(express.json());

// Logger pour chaque requête
app.use(logger);

// Connexion à MongoDB
connect();

// Limitation des requêtes (100 requêtes par minute par IP)
app.use(rateLimit(100, 60 * 1000));

// Importation des routes
import authRoutes from '@/routes/authRoutes';

// Utilisation des routes avec préfixes
app.use('/api/auth', authRoutes);

// Initialiser le WebSocketManager
export const wsManager = new WebSocketManager(server);

// Register all listeners


// Gestion des erreurs 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Route non trouvée." });
});

// Middleware global pour la gestion des erreurs
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  errorHandler(err, req, res, next);
});

// Lancer le serveur
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});

export { app, server };
