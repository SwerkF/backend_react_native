FROM node:18-alpine

WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY tsconfig*.json ./

# Installer les dépendances
RUN npm install

# Remplacer bcrypt par bcryptjs
RUN npm uninstall bcrypt
RUN npm uninstall bcryptjs
RUN npm install bcryptjs

# Copier le code source
COPY . .

# Build l'application
RUN npm run build

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=8001
ENV ACCESS_TOKEN_SECRET=abcdef778877abcdef
ENV REFRESH_TOKEN_SECRET=abcdef8877
ENV MONGO_URL=mongodb+srv://swerkpro:tQ3KxL9fM4Cv61fg@cluster0.49gyi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
ENV MONGO_DB_NAME=react-native-app

# Exposer le port
EXPOSE 8001

# Démarrer l'application
CMD ["npm", "start"]
