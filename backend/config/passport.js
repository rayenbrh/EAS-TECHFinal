const dotenv = require('dotenv');
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Charger les variables d'environnement
dotenv.config();

// ============================================
// DEBUG: Afficher les variables d'environnement Google OAuth
// ============================================
console.log('\n🔍 [PASSPORT] Vérification des credentials Google OAuth:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 
  `${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...` : '❌ NON DÉFINI');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 
  `${process.env.GOOGLE_CLIENT_SECRET.substring(0, 10)}...` : '❌ NON DÉFINI');
console.log('GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/auth/google/callback');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Configuration de la stratégie Google OAuth 2.0
// Toujours enregistrer la stratégie pour éviter l'erreur "Unknown strategy"
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log('✅ [PASSPORT] Configuration Google OAuth 2.0 activée');
  console.log('📝 [PASSPORT] Client ID:', process.env.GOOGLE_CLIENT_ID);
  console.log('📝 [PASSPORT] Callback URL:', process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/auth/google/callback');
  
  passport.use('google', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/auth/google/callback',
  }, async (accessToken, refreshToken, profile, done) => {
    console.log('\n🔐 [PASSPORT] Authentification Google OAuth réussie');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Profile ID:', profile.id);
    console.log('📧 Email:', profile.emails?.[0]?.value || 'Non disponible');
    console.log('👤 Display Name:', profile.displayName || 'Non disponible');
    console.log('🖼️  Photo:', profile.photos?.[0]?.value ? 'Disponible' : 'Non disponible');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    try {
      // Extraire les informations du profil Google
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      const googleId = profile.id;
      
      if (!email) {
        return done(new Error('Email non trouvé dans le profil Google'), null);
      }

      // Chercher un utilisateur existant par email ou googleId
      let user = await User.findOne({ 
        $or: [
          { email: email },
          { googleId: googleId }
        ]
      });

      if (user) {
        // Mettre à jour les informations Google si nécessaire
        if (!user.googleId) {
          user.googleId = googleId;
        }
        if (!user.picture && profile.photos && profile.photos[0]) {
          user.picture = profile.photos[0].value;
        }
        if (profile.displayName) {
          user.name = profile.displayName;
        } else if (profile.name && profile.name.givenName && profile.name.familyName) {
          user.name = `${profile.name.givenName} ${profile.name.familyName}`;
        }
        user.lastActive = Date.now();
        await user.save();
      } else {
        // Créer un nouvel utilisateur
        const userName = profile.displayName || 
                        (profile.name ? `${profile.name.givenName || ''} ${profile.name.familyName || ''}`.trim() : '') ||
                        email.split('@')[0] ||
                        'Utilisateur Google';
        
        user = await User.create({
          googleId: googleId,
          email: email,
          name: userName,
          picture: profile.photos && profile.photos[0] ? profile.photos[0].value : undefined,
          password: undefined, // Pas de mot de passe pour les utilisateurs Google
          role: 'user',
        });
      }

      // Générer un token JWT
      const token = jwt.sign(
        { 
          id: user._id, 
          email: user.email, 
          role: user.role, 
          name: user.name,
          picture: user.picture 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      // Attacher le token au profil utilisateur
      user.token = token;

      console.log('✅ [PASSPORT] Utilisateur créé/mis à jour:', {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
      
      return done(null, user);
    } catch (error) {
      console.error('❌ [PASSPORT] Erreur lors de la création/mise à jour de l\'utilisateur:', error);
      return done(error, null);
    }
  }));
  
  console.log('✅ [PASSPORT] Stratégie Google OAuth 2.0 configurée avec succès\n');
} else {
  console.warn('\n⚠️  [PASSPORT] Google OAuth 2.0 non configuré');
  console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.warn('❌ GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Défini' : '❌ NON DÉFINI');
  console.warn('❌ GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Défini' : '❌ NON DÉFINI');
  console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.warn('💡 Pour activer Google OAuth, ajoutez ces variables dans votre fichier .env\n');
  
  // Enregistrer une stratégie factice pour éviter l'erreur "Unknown strategy"
  // Cette stratégie retournera toujours une erreur
  passport.use('google', new GoogleStrategy({
    clientID: 'dummy-client-id',
    clientSecret: 'dummy-client-secret',
    callbackURL: 'http://localhost:5000/auth/google/callback',
  }, async (accessToken, refreshToken, profile, done) => {
    return done(new Error('Google OAuth 2.0 non configuré. Veuillez définir GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans votre fichier .env'), null);
  }));
  
  console.warn('⚠️  [PASSPORT] Stratégie Google factice enregistrée (retournera une erreur)\n');
}

// Sérialisation de l'utilisateur pour la session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Désérialisation de l'utilisateur depuis la session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
