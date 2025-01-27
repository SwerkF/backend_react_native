import express from "express";
import {
  register,
  login,
  getUserFromToken,
  refreshToken,
  logout,
} from "@/controllers/authController";
import { validate } from "@/middlewares/validate";
import { isAuthenticated } from "@/middlewares/auth";
import { verifyAccess } from "@/middlewares/verifyAccess";
import {
  registerSchema,
  loginSchema,
  updateUserSchema,
  filterUserSchema,
  updateUserPermissionsSchema,
} from "@/validators/userValidator";
import Joi from "joi";

const   router = express.Router();

// **Inscription d'un utilisateur**
router.post(
  "/register",
  validate(registerSchema, "body"), // Valide les données d'inscription
  register
);

// **Connexion d'un utilisateur**
router.post(
  "/login",
  validate(loginSchema, "body"), // Valide les données de connexion
  login
);

// **Récupérer l'utilisateur depuis le token**
router.get(
  "/me",
  isAuthenticated, // Vérifie que l'utilisateur est authentifié
  getUserFromToken
);

// **Rafraîchir le token d'accès**
router.post(
  "/refresh",
  validate(
    Joi.object({
      token: Joi.string().required().messages({
        "any.required": "Le champ token est obligatoire.",
      }),
    }),
    "body"
  ), // Valide la présence du token
  refreshToken
);

// **Déconnexion d'un utilisateur**
router.post(
  "/logout",
  validate(
    Joi.object({
      token: Joi.string().required().messages({
        "any.required": "Le champ token est obligatoire.",
      }),
    }),
    "body"
  ), // Valide la présence du token
  logout
);

// **Filtrer les utilisateurs (admin uniquement)**
router.get(
  "/",
  isAuthenticated, // Vérifie que l'utilisateur est authentifié
  verifyAccess(["admin"]), // Seuls les admins peuvent accéder à cette route
  validate(filterUserSchema, "query"), // Valide les paramètres de requête
  async (req, res) => {
    // Implémentez le filtre ici si nécessaire
    res.status(200).json({ message: "Route de filtrage des utilisateurs." });
  }
);

// **Mettre à jour un utilisateur**
router.put(
  "/:id",
  isAuthenticated, // Vérifie que l'utilisateur est authentifié
  verifyAccess(["admin"]), // Seuls les admins peuvent modifier un utilisateur
  validate(updateUserSchema, "body"), // Valide les champs de mise à jour
  async (req, res) => {
    // Implémentez la logique de mise à jour ici si nécessaire
    res.status(200).json({ message: "Utilisateur mis à jour avec succès." });
  }
);

// **Mettre à jour les permissions d'un utilisateur**
router.patch(
  "/:id/permissions",
  isAuthenticated, // Vérifie que l'utilisateur est authentifié
  verifyAccess(["admin"]), // Seuls les admins peuvent modifier les permissions
  validate(updateUserPermissionsSchema, "body"), // Valide les permissions
  async (req, res) => {
    // Implémentez la logique de mise à jour des permissions ici
    res.status(200).json({ message: "Permissions mises à jour avec succès." });
  }
);

export default router;