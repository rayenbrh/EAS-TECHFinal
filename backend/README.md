# Backend API - LockHeaven

Backend Node.js/Express pour l'application LockHeaven avec intégration IA.

## 🚀 Fonctionnalités

- **Authentification JWT** avec gestion des rôles (Admin, User, Guest)
- **Authentification Google OAuth 2.0** avec Passport.js pour connexion via Google
- **Intégration Mayan EDMS** pour la gestion documentaire
- **Résumés IA** avec Qwen3 4B (ou autre LLM local)
- **WebSocket** pour les notifications en temps réel
- **API RESTful** complète pour la gestion des documents et utilisateurs
- **RBAC** (Role-Based Access Control)
- **Upload de documents** avec support multi-formats
- **Recherche** de documents avec filtres avancés

## 📋 Prérequis

- Node.js 16+
- MongoDB 4.4+
- Mayan EDMS (accessible via Docker)
- Service IA local (Ollama avec Qwen3 recommandé)

## 🛠️ Installation

1. **Installer les dépendances:**

```bash
cd backend
npm install
```

2. **Configurer les variables d'environnement:**

Créer un fichier `.env.local` basé sur `.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mayan-edms
JWT_SECRET=votre-secret-jwt-unique
MAYAN_API_URL=http://localhost:8082/api
MAYAN_USERNAME=admin
MAYAN_PASSWORD=admin
AI_SERVICE_URL=http://localhost:11434
```

3. **Démarrer MongoDB:**

```bash
# Avec Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

4. **Configurer Mayan EDMS:**

Mayan EDMS doit être accessible. Voir le dossier `mayan-edms/docker/` pour la configuration Docker.

5. **Installer et configurer Ollama (pour l'IA):**

```bash
# Installer Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Télécharger le modèle Qwen3
ollama pull qwen:4b
```

## 🚦 Démarrage

**Mode développement:**

```bash
npm run dev
```

**Mode production:**

```bash
npm start
```

Le serveur démarre sur `http://localhost:5000`

## 🌱 Seed de la Base de Données

Pour créer des utilisateurs par défaut (admin, user, guest):

```bash
npm run seed
```

Pour créer uniquement un utilisateur admin:

```bash
npm run seed:admin
# Ou avec des paramètres personnalisés:
node scripts/seedAdmin.js admin@monapp.com monMotDePasse "Mon Nom"
```

**Comptes par défaut créés:**
- 👑 **Admin**: `admin@example.com` / `admin123`
- 👤 **User**: `user@example.com` / `user123`
- 👁️ **Guest**: `guest@example.com` / `guest123`

## 📚 Endpoints API

### Authentification

- `POST /api/auth/register` - Créer un compte
- `POST /api/auth/login` - Se connecter
- `GET /api/auth/me` - Obtenir le profil utilisateur
- `GET /auth/google` - Se connecter avec Google OIDC
- `GET /auth/google/callback` - Callback Google OIDC

### Utilisateurs (Admin uniquement)

- `GET /api/users` - Liste des utilisateurs
- `POST /api/users` - Créer un utilisateur
- `PUT /api/users/:id` - Modifier un utilisateur
- `DELETE /api/users/:id` - Supprimer un utilisateur

### Documents

- `GET /api/documents` - Liste des documents
- `GET /api/documents/:id` - Détails d'un document
- `POST /api/documents/upload` - Upload un document
- `POST /api/documents/search` - Rechercher des documents
- `PUT /api/documents/:id/rating` - Noter le résumé IA
- `DELETE /api/documents/:id` - Supprimer un document

### Dashboard

- `GET /api/dashboard/stats` - Statistiques générales
- `GET /api/dashboard/analytics` - Analyses détaillées

### IA

- `POST /api/ai/summarize` - Générer un résumé
- `POST /api/ai/extract-text` - Extraire le texte

## 🔐 Rôles et Permissions

### Admin
- Accès complet à toutes les fonctionnalités
- Gestion des utilisateurs
- Upload et suppression de documents
- Accès aux analytics

### User
- Consultation des documents
- Upload de documents
- Génération de résumés IA
- Consultation du dashboard

### Guest
- Consultation des documents publics uniquement
- Accès limité au dashboard

## 🔄 WebSocket Events

Le serveur émet les événements suivants via Socket.IO:

- `document:uploaded` - Nouveau document uploadé
- `document:summary` - Résumé IA généré
- `notification` - Notification générale

## 🧪 Tests

```bash
npm test
```

## 📦 Structure du projet

```
backend/
├── config/
│   ├── database.js          # Configuration MongoDB
│   └── passport.js          # Configuration Passport.js pour Google OIDC
├── middleware/
│   ├── auth.js             # Middleware authentification
│   └── errorHandler.js     # Gestion des erreurs
├── models/
│   ├── User.js             # Modèle utilisateur
│   └── Document.js         # Modèle document
├── routes/
│   ├── auth.js             # Routes authentification (login, register, me)
│   ├── auth-google.js      # Routes Google OAuth 2.0
│   ├── users.js            # Routes utilisateurs
│   ├── documents.js        # Routes documents
│   ├── dashboard.js        # Routes dashboard
│   └── ai.js               # Routes IA
├── services/
│   ├── mayanService.js     # Service Mayan EDMS
│   └── aiService.js        # Service IA
├── server.js               # Point d'entrée
└── package.json
```

## 🔧 Configuration Mayan EDMS

Le backend communique avec Mayan EDMS via son API REST. Assurez-vous que:

1. Mayan EDMS est démarré et accessible
2. Les credentials (username/password) sont corrects dans `.env`
3. L'API est accessible à l'URL configurée

## 🔐 Configuration Google OAuth 2.0

Pour configurer l'authentification Google OAuth 2.0:

1. **Créer un projet dans Google Cloud Console:**
   - Aller sur https://console.cloud.google.com/
   - Créer un nouveau projet ou sélectionner un projet existant
   - Activer l'API Google Identity Platform

2. **Créer les identifiants OAuth 2.0:**
   - Aller dans "APIs & Services" > "Credentials"
   - Cliquer sur "Create Credentials" > "OAuth client ID"
   - Choisir "Web application"
   - Ajouter l'URI de redirection autorisée: `http://localhost:5000/auth/google/callback` (ou votre URL de production)
   - Note: Pour la production, ajoutez également votre URL de production dans les URIs de redirection autorisées

3. **Ajouter les variables d'environnement:**
   ```env
   GOOGLE_CLIENT_ID=votre-client-id.googleusercontent.com
   GOOGLE_CLIENT_SECRET=votre-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback
   SESSION_SECRET=votre-session-secret-uniqe
   FRONTEND_URL=http://localhost:3000
   ```

4. **Note:** Les utilisateurs se connectant via Google auront automatiquement le rôle "user" par défaut. Les administrateurs peuvent modifier ce rôle via l'interface de gestion des utilisateurs.

## 🤖 Configuration IA

Pour utiliser un LLM local:

**Option 1: Ollama (recommandé)**

```bash
ollama serve
ollama pull qwen:4b
```

**Option 2: LM Studio**

Télécharger et démarrer LM Studio avec un modèle compatible.

**Option 3: Service IA personnalisé**

Créer votre propre service compatible avec l'API `/api/generate`.

## 🐛 Dépannage

### MongoDB ne se connecte pas

Vérifier que MongoDB est démarré:
```bash
sudo systemctl status mongod
```

### Mayan EDMS non accessible

Vérifier les containers Docker:
```bash
cd ../mayan-edms/docker
docker-compose ps
```

### Service IA non disponible

Le backend fonctionne sans service IA mais avec des résumés par défaut. Pour activer l'IA:
```bash
ollama serve
```

## 📄 Licence

MIT

