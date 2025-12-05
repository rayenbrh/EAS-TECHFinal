const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const connectDB = require('../config/database');

// Charger les variables d'environnement
dotenv.config();

/**
 * Script de seed pour créer uniquement un utilisateur admin
 * Usage: node scripts/seedAdmin.js [email] [password] [name]
 */
const seedAdmin = async () => {
  try {
    console.log('\n🌱 [SEED-ADMIN] Création d\'un utilisateur administrateur');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Récupérer les arguments de la ligne de commande
    const args = process.argv.slice(2);
    const email = args[0] || 'admin@example.com';
    const password = args[1] || 'admin123';
    const name = args[2] || 'Administrateur';
    
    // Forcer le rôle admin
    const role = 'admin';

    console.log('📝 [SEED-ADMIN] Paramètres:');
    console.log(`   - Email: ${email}`);
    console.log(`   - Nom: ${name}`);
    console.log(`   - Rôle: ${role} (forcé)`);
    console.log(`   - Mot de passe: ${'*'.repeat(password.length)}\n`);

    // Connexion à la base de données
    await connectDB();
    console.log('✅ [SEED-ADMIN] Connexion à MongoDB réussie\n');

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      console.log(`⚠️  [SEED-ADMIN] Utilisateur "${email}" existe déjà - Mise à jour...`);
      
      // Mettre à jour l'utilisateur existant pour s'assurer qu'il est admin
      existingUser.name = name;
      existingUser.role = role; // Forcer le rôle admin
      existingUser.isActive = true;
      existingUser.password = password; // Le hash sera fait automatiquement par le pre-save hook
      
      await existingUser.save();
      console.log(`✅ [SEED-ADMIN] Utilisateur "${email}" mis à jour avec succès`);
      console.log(`   - Nom: ${existingUser.name}`);
      console.log(`   - Email: ${existingUser.email}`);
      console.log(`   - Rôle: ${existingUser.role}`);
      console.log(`   - ID: ${existingUser._id}`);
    } else {
      // Créer un nouvel utilisateur admin
      const user = await User.create({
        name: name,
        email: email.toLowerCase(),
        password: password, // Le hash sera fait automatiquement par le pre-save hook
        role: role, // Forcer le rôle admin
        isActive: true,
      });
      
      console.log(`✅ [SEED-ADMIN] Utilisateur admin créé avec succès!`);
      console.log(`   - Nom: ${user.name}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Rôle: ${user.role}`);
      console.log(`   - ID: ${user._id}`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔐 [SEED-ADMIN] Informations de connexion:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email: ${email}`);
    console.log(`Mot de passe: ${password}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ [SEED-ADMIN] Script terminé avec succès!\n');
    
    // Fermer la connexion
    await mongoose.connection.close();
    console.log('🔌 [SEED-ADMIN] Connexion MongoDB fermée\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ [SEED-ADMIN] Erreur lors de l\'exécution du script:');
    console.error(error);
    console.error('\n');
    
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Exécuter le script
if (require.main === module) {
  seedAdmin();
}

module.exports = seedAdmin;
