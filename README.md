# 🚀 LockHeaven - Progressive Web App

Une Progressive Web App moderne construite avec React.js et Node.js pour la gestion documentaire avec Mayan EDMS et résumés IA.

![Dashboard](https://img.shields.io/badge/Dashboard-Analytics-blue)
![PWA](https://img.shields.io/badge/PWA-Ready-green)
![AI](https://img.shields.io/badge/AI-Qwen3-purple)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Fonctionnalités principales

### 📱 Application
- ✅ **Progressive Web App** - Installation sur tous les appareils
- ✅ **Responsive Design** - Desktop, tablette, mobile
- ✅ **Dark/Light Mode** - Thème adaptatif
- ✅ **Offline Support** - Fonctionne sans connexion
- ✅ **Notifications Push** - Alertes en temps réel

### 📄 Gestion documentaire
- ✅ **Upload multi-fichiers** - Drag & drop
- ✅ **Recherche avancée** - Par nom, tags, contenu
- ✅ **Prévisualisation** - PDF, Word, Excel, Images
- ✅ **Métadonnées** - Tags, auteur, date
- ✅ **Versioning** - Via le système de gestion documentaire

### 🤖 Intelligence Artificielle
- ✅ **Résumés automatiques** - IA Qwen3 4B
- ✅ **Points clés** - Extraction automatique
- ✅ **OCR** - Reconnaissance de texte
- ✅ **Notation** - Feedback utilisateur

### 👥 Gestion des utilisateurs
- ✅ **RBAC** - Admin, User, Guest
- ✅ **JWT Authentication** - Sécurisé
- ✅ **Gestion des rôles** - Permissions granulaires
- ✅ **Activité utilisateur** - Tracking

### 📊 Analytics
- ✅ **Dashboard interactif** - Métriques en temps réel
- ✅ **Graphiques** - Line, Bar, Doughnut
- ✅ **Statistiques** - Documents, utilisateurs, IA
- ✅ **Exports** - Données et rapports

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
│  • Material-UI  • Charts  • PWA  • WebSocket Client     │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────┐
│                Backend (Node.js/Express)                 │
│  • JWT Auth  • REST API  • WebSocket  • Multer         │
└──────────┬──────────────────────┬──────────────────────┘
           │                       │
           ↓                       ↓
┌──────────────────┐      ┌───────────────────┐
│   Document Store │      │   MongoDB         │
│   • Documents    │      │   • Users         │
│   • Metadata     │      │   • Documents     │
│   • OCR          │      │   • Sessions      │
└──────────────────┘      └───────────────────┘
           │
           ↓
┌──────────────────┐
│   Ollama/Qwen3   │
│   • AI Summaries │
│   • Text Extract │
└──────────────────┘
```

## 🚀 Installation rapide

### Prérequis

- **Node.js** 16+ et npm
- **Docker** et Docker Compose
- **MongoDB** 4.4+
- **Git**

### 1️⃣ Cloner le projet

```bash
git clone <repository-url>
cd mayan-edms-pwa
```

### 2️⃣ Démarrage avec Docker (Recommandé)

```bash
# Démarrer tous les services
docker-compose up -d

# Télécharger le modèle IA (première fois uniquement)
docker exec -it mayan-ollama ollama pull qwen:4b

# Accéder aux applications:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:5000
# - Document Store: http://localhost:8082
```

### 3️⃣ Installation manuelle

#### Backend

```bash
cd backend
npm install
cp .env.example .env
# Éditer .env avec vos configurations
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

#### Système de gestion documentaire

```bash
cd mayan-edms/docker
docker-compose --profile all_in_one --profile postgresql --profile redis --profile rabbitmq up -d
```

#### Ollama (IA)

```bash
# Installer Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Démarrer le service
ollama serve

# Télécharger le modèle
ollama pull qwen:4b
```

## 📖 Documentation

### Frontend
Voir [frontend/README.md](frontend/README.md) pour:
- Structure du projet
- Composants React
- Configuration PWA
- Guide de développement

### Backend
Voir [backend/README.md](backend/README.md) pour:
- API Endpoints
- Authentification
- Services
- Modèles de données

### Système de gestion documentaire
Voir [mayan-edms/README.md](mayan-edms/README.md) pour:
- Configuration Docker
- API REST
- Gestion documentaire

## 🔐 Comptes par défaut

### Admin
- **Email:** admin@example.com
- **Mot de passe:** admin123

### User
- **Email:** user@example.com
- **Mot de passe:** user123

### Guest
- **Email:** guest@example.com
- **Mot de passe:** guest123

> ⚠️ **Important:** Changez ces credentials en production !

## 📱 Accès aux applications

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend PWA** | http://localhost:3000 | Interface utilisateur React |
| **Backend API** | http://localhost:5000 | API REST + WebSocket |
| **Mayan EDMS** | http://localhost:8082 | Interface Mayan originale |
| **MongoDB** | localhost:27017 | Base de données |
| **Ollama** | localhost:11434 | Service IA |

## 🧪 Tests

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 📦 Build pour production

### Frontend
```bash
cd frontend
npm run build
# Les fichiers seront dans dist/
```

### Backend
```bash
cd backend
npm start
```

### Docker (Tout en un)
```bash
docker-compose up -d --build
```

## 🛠️ Technologies utilisées

### Frontend
- **React 18** - Framework UI
- **Material-UI 5** - Composants
- **Vite** - Build tool
- **Chart.js** - Graphiques
- **Socket.IO Client** - WebSocket
- **Axios** - HTTP client
- **React Router** - Navigation
- **Workbox** - Service Worker

### Backend
- **Node.js** - Runtime
- **Express** - Framework web
- **MongoDB** - Base de données
- **Socket.IO** - WebSocket
- **JWT** - Authentication
- **Multer** - Upload fichiers
- **Axios** - HTTP client

### IA & Documents
- **Ollama/Qwen3** - LLM local
- **Mayan EDMS** - Système de gestion documentaire (externe)
- **PostgreSQL** - Base de données
- **Redis** - Cache
- **RabbitMQ** - Queue

## 🔧 Configuration

### Variables d'environnement

#### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mayan-edms
JWT_SECRET=your-secret-key
MAYAN_API_URL=http://localhost:8082/api
MAYAN_USERNAME=admin
MAYAN_PASSWORD=admin
AI_SERVICE_URL=http://localhost:11434
AI_MODEL=qwen:4b
CORS_ORIGIN=http://localhost:3000
```

#### Frontend (vite.config.js)
```javascript
server: {
  port: 3000,
  proxy: {
    '/api': 'http://localhost:5000'
  }
}
```

## 🐛 Dépannage

### Le frontend ne se connecte pas au backend
```bash
# Vérifier que le backend est démarré
curl http://localhost:5000/api/health

# Vérifier les logs
cd backend && npm run dev
```

### Système de gestion documentaire non accessible
```bash
# Vérifier les containers Docker
cd mayan-edms/docker
docker-compose ps

# Redémarrer si nécessaire
docker-compose restart
```

### L'IA ne génère pas de résumés
```bash
# Vérifier qu'Ollama est démarré
curl http://localhost:11434/api/tags

# Télécharger le modèle si nécessaire
ollama pull qwen:4b
```

### MongoDB ne se connecte pas
```bash
# Vérifier que MongoDB est démarré
docker ps | grep mongo
# ou
sudo systemctl status mongod
```

## 📄 Licence

MIT License - Voir [LICENSE](LICENSE) pour plus de détails.

## 👥 Contribution

Les contributions sont les bienvenues ! Veuillez:

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📞 Support

Pour toute question ou problème:

- 📧 Email: support@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 📖 Documentation: [Wiki](https://github.com/your-repo/wiki)

## 🎯 Roadmap

- [ ] Multi-langue (i18n)
- [ ] Export PDF des résumés
- [ ] Intégration ChatGPT
- [ ] App mobile native
- [ ] Workflow automation
- [ ] Advanced search filters
- [ ] Document comparison
- [ ] E-signature integration

## ⭐ Star History

Si ce projet vous est utile, n'hésitez pas à lui donner une ⭐ sur GitHub !

---

**Développé avec ❤️ pour la communauté open source**

