# Étape de build
FROM node:18-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY tsconfig*.json ./

# Installer les dépendances
RUN npm ci

# Copier les sources
COPY src/ ./src/

# Build l'application
RUN npm run build

# Étape de production
FROM node:18-alpine AS runner

WORKDIR /app

# Copier les fichiers nécessaires depuis l'étape de build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Installer uniquement les dépendances de production
RUN npm ci --only=production

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=8001

# Exposer le port
EXPOSE 8001

# Démarrer l'application
CMD ["node", "dist/index.js"]
