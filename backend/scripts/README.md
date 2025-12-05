# Scripts de Seed

Ce dossier contient les scripts de seed pour initialiser la base de données avec des données par défaut.

## 🌱 Seed des Utilisateurs

Le script `seedUsers.js` crée des utilisateurs par défaut pour tester l'application.

### Utilisation

```bash
# Depuis la racine du projet
cd backend
npm run seed

# Ou directement
node scripts/seedUsers.js
```

### Utilisateurs créés

Le script crée les utilisateurs suivants :

#### 👑 Administrateur
- **Email**: `admin@example.com`
- **Mot de passe**: `admin123`
- **Rôle**: `admin`
- **Permissions**: Accès complet à toutes les fonctionnalités

#### 👤 Utilisateur
- **Email**: `user@example.com`
- **Mot de passe**: `user123`
- **Rôle**: `user`
- **Permissions**: Upload et consultation de documents

#### 👁️ Invité
- **Email**: `guest@example.com`
- **Mot de passe**: `guest123`
- **Rôle**: `guest`
- **Permissions**: Consultation des documents publics uniquement

### Fonctionnalités

- ✅ Crée les utilisateurs s'ils n'existent pas
- ✅ Met à jour les utilisateurs existants (nom, rôle, mot de passe)
- ✅ Affiche un résumé de tous les utilisateurs
- ✅ Hash automatique des mots de passe
- ✅ Gestion des erreurs

### Notes

- Les mots de passe sont automatiquement hashés avec bcrypt
- Si un utilisateur existe déjà, il sera mis à jour avec les nouvelles valeurs
- Le script peut être exécuté plusieurs fois en toute sécurité (idempotent)

## 🌱 Seed des Projets

Le script `seedProjects.js` crée 3 projets avec des documents fictifs pour tester l'application.

### Utilisation

```bash
# Depuis la racine du projet
cd backend
npm run seed:projects

# Ou directement
node scripts/seedProjects.js

# Pour créer utilisateurs ET projets
npm run seed:all
```

### Projets créés

Le script crée les projets suivants avec des documents associés :

#### 📊 Projet Alpha - Gestion Financière
- **Description**: Projet de gestion financière et comptabilité pour le trimestre Q1 2024
- **Documents**:
  - Rapport Financier Q1 2024.pdf (2.3 MB)
  - Budget Annuel 2024.xlsx (153 KB)
  - Analyse des Tendances du Marché.docx (965 KB)

#### 👥 Projet Beta - Ressources Humaines
- **Description**: Gestion des ressources humaines, recrutements et évaluations
- **Documents**:
  - Politique RH 2024.pdf (1.2 MB)
  - Rapport de Recrutement Q1 2024.docx (639 KB)

#### 🚀 Projet Gamma - Innovation & R&D
- **Description**: Projet d'innovation et de recherche & développement
- **Documents**:
  - Roadmap Innovation 2024.pdf (3.3 MB)
  - Prototype IA v1.0.pptx (8.4 MB)
  - Analyse Concurrents Technologiques.xlsx (229 KB)

### Fonctionnalités

- ✅ Crée 3 projets avec descriptions détaillées
- ✅ Ajoute 8 documents fictifs au total avec métadonnées complètes
- ✅ Génère des données IA complètes (résumés, entités, sentiment, analytics)
- ✅ Associe les projets à un utilisateur admin
- ✅ Gère les doublons (ne recrée pas les projets/documents existants)
- ✅ Affiche un résumé détaillé

### Notes

- Les documents incluent des données IA complètes (résumés, entités, sentiment, analytics)
- Si un projet existe déjà, il sera mis à jour
- Si un document existe déjà (même mayanId), il sera ignoré
- Le script peut être exécuté plusieurs fois en toute sécurité (idempotent)
- Les documents sont associés à l'utilisateur admin (créé automatiquement si nécessaire)
