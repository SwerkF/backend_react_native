# Étape de build
FROM node:18-alpine AS builder

# Installer les dépendances nécessaires pour la compilation
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY tsconfig*.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Compiler l'application TypeScript
RUN npm run build

# Étape de production
FROM node:18-alpine AS runner

# Créer un utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers nécessaires depuis l'étape de build
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Passer à l'utilisateur non-root
USER nextjs

# Configurer les variables d'environnement
ENV NODE_ENV=production \
    PORT=8001

# Exposer le port de l'application
EXPOSE 8001

# Démarrer l'application
CMD ["node", "dist/index.js"]