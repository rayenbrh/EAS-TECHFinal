const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

// ============= Routes Google OAuth 2.0 =============

// Middleware pour vérifier si Google OAuth est configuré
const checkGoogleOAuthConfig = (req, res, next) => {
  console.log('\n🔍 [AUTH-GOOGLE] Vérification de la configuration Google OAuth');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 
    `✅ ${process.env.GOOGLE_CLIENT_ID.substring(0, 30)}...` : '❌ NON DÉFINI');
  console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 
    `✅ ${process.env.GOOGLE_CLIENT_SECRET.substring(0, 10)}...` : '❌ NON DÉFINI');
  console.log('GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/auth/google/callback');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('❌ [AUTH-GOOGLE] Google OAuth non configuré - Redirection vers login');
    const frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/login?error=google_not_configured`);
  }
  console.log('✅ [AUTH-GOOGLE] Configuration Google OAuth valide\n');
  next();
};

// @route   GET /auth/google
// @desc    Initier l'authentification Google OAuth 2.0
// @access  Public
router.get('/google', checkGoogleOAuthConfig, (req, res, next) => {
  // Vérifier à nouveau que les credentials sont configurés avant d'authentifier
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('❌ [AUTH-GOOGLE] Tentative d\'authentification sans credentials configurés');
    const frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/login?error=google_not_configured`);
  }
  
  console.log('\n🚀 [AUTH-GOOGLE] Démarrage de l\'authentification Google OAuth');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📍 URL de redirection Google:', 'https://accounts.google.com/o/oauth2/v2/auth');
  console.log('🔑 Client ID:', process.env.GOOGLE_CLIENT_ID);
  console.log('🔄 Callback URL:', process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/auth/google/callback');
  console.log('📋 Scopes:', ['profile', 'email']);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

// @route   GET /auth/google/callback
// @desc    Callback Google OAuth 2.0 après authentification
// @access  Public
router.get(
  '/google/callback',
  checkGoogleOAuthConfig,
  (req, res, next) => {
    // Vérifier à nouveau que les credentials sont configurés
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('❌ [AUTH-GOOGLE] Callback reçu sans credentials configurés');
      const frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/login?error=google_not_configured`);
    }
    passport.authenticate('google', { failureRedirect: '/login?error=google_failed' })(req, res, next);
  },
  async (req, res) => {
    try {
      // L'utilisateur est maintenant authentifié via session
      // Récupérer le token JWT depuis req.user (attaché dans la stratégie Passport)
      if (req.user && req.user.token) {
        // Rediriger vers le frontend avec le token dans l'URL
        const frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/auth/callback?token=${req.user.token}`);
      } else {
        // Si pas de token, générer un nouveau token
        const token = jwt.sign(
          {
            id: req.user._id,
            email: req.user.email,
            role: req.user.role,
            name: req.user.name,
            picture: req.user.picture,
          },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );
        
        const frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000';
        console.log('🔄 [AUTH-GOOGLE] Redirection vers le frontend avec nouveau token');
        console.log('📍 Frontend URL:', frontendUrl);
        res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
      }
    } catch (error) {
      console.error('\n❌ [AUTH-GOOGLE] Erreur dans le callback Google OAuth');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Erreur:', error.message);
      console.error('Stack:', error.stack);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      const frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/login?error=google_callback_error`);
    }
  }
);

// @route   GET /auth/google/test
// @desc    Tester la configuration Google OAuth (pour debug)
// @access  Public
router.get('/google/test', (req, res) => {
  const config = {
    googleOAuthConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    clientId: process.env.GOOGLE_CLIENT_ID ? 
      `${process.env.GOOGLE_CLIENT_ID.substring(0, 30)}...` : null,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 
      `${process.env.GOOGLE_CLIENT_SECRET.substring(0, 10)}...` : null,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/auth/google/callback',
    frontendUrl: process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000',
  };

  console.log('\n🧪 [AUTH-GOOGLE] Test de configuration Google OAuth');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Configuration:', JSON.stringify(config, null, 2));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  res.json({
    success: true,
    message: 'Configuration Google OAuth',
    config,
    status: config.googleOAuthConfigured ? '✅ Configuré' : '❌ Non configuré',
  });
});

module.exports = router;
