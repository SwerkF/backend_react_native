FROM node:18-alpine

WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY tsconfig*.json ./

# Installer les dépendances
RUN npm install

# Copier le code source
COPY . .

# Build l'application
RUN npm run build

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=8001

# Exposer le port
EXPOSE 8001

# Démarrer l'application avec module-alias
CMD ["node", "-r", "module-alias/register", "dist/index.js"]
