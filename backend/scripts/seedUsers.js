const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const connectDB = require('../config/database');

// Charger les variables d'environnement
dotenv.config();

/**
 * Script de seed pour créer des utilisateurs par défaut
 */
const seedUsers = async () => {
  try {
    console.log('\n🌱 [SEED] Démarrage du script de seed des utilisateurs');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Connexion à la base de données
    await connectDB();
    console.log('✅ [SEED] Connexion à MongoDB réussie\n');

    // Liste des utilisateurs à créer
    const defaultUsers = [
      {
        name: 'Administrateur',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        isActive: true,
      },
      {
        name: 'Utilisateur Test',
        email: 'user@example.com',
        password: 'user123',
        role: 'user',
        isActive: true,
      },
      {
        name: 'Invité Test',
        email: 'guest@example.com',
        password: 'guest123',
        role: 'guest',
        isActive: true,
      },
    ];

    console.log('📝 [SEED] Création des utilisateurs par défaut...\n');

    for (const userData of defaultUsers) {
      try {
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ email: userData.email });

        if (existingUser) {
          console.log(`⚠️  [SEED] Utilisateur "${userData.email}" existe déjà - Mise à jour...`);
          
          // Mettre à jour l'utilisateur existant
          existingUser.name = userData.name;
          existingUser.role = userData.role;
          existingUser.isActive = userData.isActive;
          
          // Mettre à jour le mot de passe seulement s'il est fourni
          if (userData.password) {
            existingUser.password = userData.password;
          }
          
          await existingUser.save();
          console.log(`✅ [SEED] Utilisateur "${userData.email}" mis à jour avec succès`);
        } else {
          // Créer un nouvel utilisateur
          const user = await User.create(userData);
          console.log(`✅ [SEED] Utilisateur "${userData.email}" créé avec succès`);
          console.log(`   - Nom: ${user.name}`);
          console.log(`   - Email: ${user.email}`);
          console.log(`   - Rôle: ${user.role}`);
          console.log(`   - ID: ${user._id}`);
        }
      } catch (error) {
        console.error(`❌ [SEED] Erreur lors de la création de "${userData.email}":`, error.message);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 [SEED] Résumé des utilisateurs:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const allUsers = await User.find().select('name email role isActive createdAt');
    
    console.log('👥 Utilisateurs dans la base de données:\n');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Rôle: ${user.role} | Actif: ${user.isActive ? 'Oui' : 'Non'}`);
      console.log(`   Créé le: ${user.createdAt.toLocaleDateString('fr-FR')}\n`);
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔐 [SEED] Comptes de test créés:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👑 Admin:');
    console.log('   Email: admin@example.com');
    console.log('   Mot de passe: admin123');
    console.log('\n👤 Utilisateur:');
    console.log('   Email: user@example.com');
    console.log('   Mot de passe: user123');
    console.log('\n👁️  Invité:');
    console.log('   Email: guest@example.com');
    console.log('   Mot de passe: guest123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ [SEED] Script de seed terminé avec succès!\n');
    
    // Fermer la connexion
    await mongoose.connection.close();
    console.log('🔌 [SEED] Connexion MongoDB fermée\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ [SEED] Erreur lors de l\'exécution du script de seed:');
    console.error(error);
    console.error('\n');
    
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Exécuter le script
if (require.main === module) {
  seedUsers();
}

module.exports = seedUsers;
