# Frontend - LockHeaven

Progressive Web App React pour la gestion documentaire avec IA.

## ✨ Fonctionnalités

- 📱 **PWA** - Installation sur mobile et desktop
- 🎨 **Material-UI** - Interface moderne et professionnelle
- 🌓 **Dark/Light Mode** - Thème adaptatif
- 📊 **Tableaux de bord** - Analytics et métriques en temps réel
- 📄 **Gestion de documents** - Upload, recherche, visualisation
- 🤖 **Résumés IA** - Génération automatique avec notation
- 🔔 **Notifications temps réel** - Via WebSocket
- 👥 **Gestion utilisateurs** - RBAC (Admin, User, Guest)
- 📱 **Responsive** - Desktop, tablette, mobile
- 📈 **Graphiques interactifs** - Chart.js pour les analytics

## 🚀 Installation

```bash
cd frontend
npm install
```

## 🛠️ Configuration

Le frontend se connecte au backend via proxy Vite (configuré dans `vite.config.js`):

```javascript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true
    }
  }
}
```

## 🚦 Démarrage

**Mode développement:**

```bash
npm run dev
```

L'application sera disponible sur `http://localhost:3000`

**Build pour production:**

```bash
npm run build
```

**Prévisualiser le build:**

```bash
npm run preview
```

## 📱 Installation PWA

### Desktop (Chrome/Edge)
1. Ouvrir l'application
2. Cliquer sur l'icône d'installation dans la barre d'adresse
3. Confirmer l'installation

### Mobile
1. Ouvrir l'application dans le navigateur
2. Menu → "Ajouter à l'écran d'accueil"
3. L'application sera installée comme une app native

## 🎨 Structure de l'interface

### Dashboard
- **Cartes de métriques** - Documents, uploads, utilisateurs, résumés IA
- **Graphiques audience** - Vues de pages, utilisateurs actifs
- **Graphique utilisateurs** - Nouveaux vs anciens
- **Graphiques mensuels** - Ventes et croissance
- **Sessions par appareil** - Desktop, tablette, mobile

### Documents
- **Liste des documents** - Avec aperçu et tags
- **Upload drag & drop** - Support multi-fichiers
- **Recherche** - Par nom, tags, contenu
- **Résumés IA** - Avec points clés et notation
- **Actions** - Voir, télécharger, supprimer

### Utilisateurs (Admin)
- **Tableau utilisateurs** - Nom, email, rôle, activité
- **Gestion des rôles** - Admin, User, Guest
- **CRUD complet** - Créer, modifier, supprimer

### Paramètres
- **Profil utilisateur** - Nom, email, téléphone
- **Notifications** - Email, push, documents, IA
- **Sécurité** - 2FA, timeout de session
- **Configuration Mayan** - URL API, token

## 🔐 Authentification

### Comptes de test

**Admin:**
- Email: `admin@example.com`
- Mot de passe: `admin123`

**User:**
- Email: `user@example.com`
- Mot de passe: `user123`

**Guest:**
- Email: `guest@example.com`
- Mot de passe: `guest123`

### Rôles et permissions

| Fonctionnalité | Admin | User | Guest |
|---------------|-------|------|-------|
| Dashboard | ✅ | ✅ | ✅ |
| Voir documents | ✅ | ✅ | 📄 Public |
| Upload documents | ✅ | ✅ | ❌ |
| Supprimer documents | ✅ | ❌ | ❌ |
| Gérer utilisateurs | ✅ | ❌ | ❌ |
| Analytics avancées | ✅ | ❌ | ❌ |
| Résumés IA | ✅ | ✅ | ❌ |

## 🔔 Notifications

L'application reçoit des notifications en temps réel via WebSocket:

- 📤 **Upload de document** - Quand un document est uploadé
- 🤖 **Résumé IA généré** - Quand l'IA termine un résumé
- 👤 **Changement de rôle** - Modifications utilisateur
- 📊 **Mises à jour** - Changements importants

## 📊 Graphiques et Analytics

### Types de graphiques
- **Line Charts** - Évolution temporelle
- **Bar Charts** - Comparaisons
- **Doughnut Charts** - Répartitions
- **Area Charts** - Tendances

### Données visualisées
- Documents uploadés par période
- Utilisateurs actifs
- Taux de rebond
- Vues de pages
- Sessions par appareil
- Croissance mensuelle

## 🎨 Thèmes

### Mode sombre (défaut)
- Fond: `#121212`
- Surface: `#1e1e1e`
- Primary: `#6200ea` (violet)
- Secondary: `#03dac6` (cyan)

### Mode clair
- Fond: `#fafafa`
- Surface: `#ffffff`
- Primary: `#6200ea`
- Secondary: `#03dac6`

Le thème est sauvegardé dans `localStorage` et persiste entre les sessions.

## 📱 Support des navigateurs

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Opera 76+

## 🔧 Technologies utilisées

- **React 18** - Framework UI
- **Material-UI 5** - Composants UI
- **Vite** - Build tool
- **Chart.js** - Graphiques
- **React Router** - Routing
- **Axios** - Requêtes HTTP
- **Socket.IO Client** - WebSocket
- **React Dropzone** - Upload fichiers
- **Notistack** - Notifications
- **JWT Decode** - Décodage tokens

## 📦 Structure du projet

```
frontend/
├── public/
│   ├── pwa-192x192.png
│   └── pwa-512x512.png
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── MainLayout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Topbar.jsx
│   │   └── PrivateRoute.jsx
│   ├── contexts/
│   │   ├── AuthContext.jsx
│   │   └── NotificationContext.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Documents.jsx
│   │   ├── Users.jsx
│   │   ├── Settings.jsx
│   │   └── Login.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js
└── package.json
```

## 🐛 Dépannage

### Le backend ne répond pas

Vérifier que le backend est démarré sur le port 5000:
```bash
cd ../backend
npm run dev
```

### Les notifications ne fonctionnent pas

Vérifier la connexion WebSocket dans la console du navigateur.

### Les graphiques ne s'affichent pas

Vider le cache du navigateur et recharger:
- Chrome: `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)

## 📄 Licence

MIT

