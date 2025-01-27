import { Request, Response } from "express";

interface CustomRequest extends Request {
  user?: { id: string };
}

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
import UserModel, { IUser } from "@/models/userModel";
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;
const TOKEN_EXPIRATION = "1h"; // Expiration du token d'accès

/**
 * Register a new user.
 * @param req.body.firstName - The user's first name.
 * @param req.body.lastName - The user's last name.
 * @param req.body.email - The user's email address.
 * @param req.body.password - The user's password.
 * @param req.body.roles - Optional roles of the user (defaults to ["client"]).
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  const { firstName, lastName, email, password, roles } = req.body;

  if (!firstName || !lastName || !email || !password) {
    res.status(400).json({ message: "Tous les champs sont requis." });
    return;
  }

  try {
    // Vérifier si l'email est déjà utilisé
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      res.status(409).json({ message: "Cet email est déjà utilisé." });
      return;
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Vérifier et définir les rôles
    const userRoles = Array.isArray(roles) ? roles : ["ROLE_CLIENT"];

    // Créer un nouvel utilisateur
    const newUser: IUser = new UserModel({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      roles: userRoles,
    });

    await newUser.save();

    res.status(201).json({ message: "Utilisateur créé avec succès." });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'inscription.", error });
  }
};

/**
 * Log in a user.
 * @param req.body.email - The user's email address.
 * @param req.body.password - The user's password.
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: "Email et mot de passe requis." });
    return;
  }

  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      res.status(404).json({ message: "Utilisateur introuvable." });
      return;
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: "Mot de passe incorrect." });
      return;
    }

    // Générer les tokens
    const accessToken = jwt.sign(
      { id: user._id, roles: user.roles },
      ACCESS_TOKEN_SECRET,
      { expiresIn: TOKEN_EXPIRATION }
    );

    const refreshToken = jwt.sign({ id: user._id }, REFRESH_TOKEN_SECRET);

    // Stocker le refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({ access_token: accessToken, refresh_token: refreshToken });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la connexion.", error });
  }
};

/**
 * Retrieve a user from an access token.
 * @header Authorization - Bearer token containing the access token.
 */
export const getUserFromToken = async (req: CustomRequest, res: Response): Promise<void> => {
  const userReq = req.user;

  try {
    const user = await UserModel.findById(userReq?.id).select("-password");
    if (!user) {
      res.status(404).json({ message: "Utilisateur introuvable." });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(401).json({ message: "Token invalide ou expiré." });
  }
};

/**
 * Refresh an access token.
 * @param req.body.token - The refresh token.
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.body;

  if (!token) {
    res.status(401).json({ message: "Token de rafraîchissement requis." });
    return;
  }

  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as { id: string };
    const user = await UserModel.findById(decoded.id);

    if (!user || user.refreshToken !== token) {
      res.status(403).json({ message: "Token invalide." });
      return;
    }

    // Générer un nouveau token d'accès
    const newAccessToken = jwt.sign(
      { id: user._id, roles: user.roles },
      ACCESS_TOKEN_SECRET,
      { expiresIn: TOKEN_EXPIRATION }
    );

    // Générer un nouveau token de rafraîchissement
    const newRefreshToken = jwt.sign({ id: user._id }, REFRESH_TOKEN_SECRET);
    user.refreshToken = newRefreshToken;
    await user.save();

    res.status(200).json({ access_token: newAccessToken, refresh_token: newRefreshToken });
  } catch (error) {
    res.status(403).json({ message: "Token de rafraîchissement invalide ou expiré." });
  }
};

/**
 * Log out a user by invalidating the refresh token.
 * @param req.body.token - The refresh token to invalidate.
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.body;

  if (!token) {
    res.status(400).json({ message: "Token de rafraîchissement requis pour la déconnexion." });
    return;
  }

  try {
    const user = await UserModel.findOne({ refreshToken: token });
    if (!user) {
      res.status(403).json({ message: "Token invalide." });
      return;
    }

    // Supprimer le refresh token
    user.refreshToken = undefined;
    await user.save();

    res.status(200).json({ message: "Déconnexion réussie." });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la déconnexion.", error });
  }
};
