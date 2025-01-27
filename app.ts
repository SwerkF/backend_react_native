import express, { Application, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import connect from "./src/config/conn"; // Alias @/ fonctionne ici
import { isAuthenticated } from "./src/middlewares/auth";
import { rateLimit } from "./src/middlewares/rateLimit";
import { errorHandler } from "./src/middlewares/errorHandler";
import { logger } from "./src/middlewares/logger";


dotenv.config();

const app: Application = express();

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
import authRoutes from './src/routes/authRoutes';

// Utilisation des routes avec préfixes
app.use('/api/auth', authRoutes);

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
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
