const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const passport = require('./config/passport');
const connectDB = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');

// Charger les variables d'environnement
dotenv.config();

// ============================================
// DEBUG: Afficher toutes les variables d'environnement importantes
// ============================================
console.log('\n🔧 [SERVER] Configuration du serveur');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📦 NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('🌐 PORT:', process.env.PORT || 5000);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n🔐 [SERVER] Variables d\'authentification:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Défini' : '❌ NON DÉFINI');
console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? '✅ Défini' : '❌ NON DÉFINI');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n🔑 [SERVER] Google OAuth 2.0:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 
  `✅ ${process.env.GOOGLE_CLIENT_ID.substring(0, 30)}...` : '❌ NON DÉFINI');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 
  `✅ ${process.env.GOOGLE_CLIENT_SECRET.substring(0, 10)}...` : '❌ NON DÉFINI');
console.log('GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/auth/google/callback');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n🗄️  [SERVER] Base de données:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 
  process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@') : '❌ NON DÉFINI');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n📄 [SERVER] Document Store:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('MAYAN_API_URL:', process.env.MAYAN_API_URL || '❌ NON DÉFINI');
console.log('MAYAN_USERNAME:', process.env.MAYAN_USERNAME || '❌ NON DÉFINI');
console.log('MAYAN_PASSWORD:', process.env.MAYAN_PASSWORD ? '✅ Défini' : '❌ NON DÉFINI');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n🤖 [SERVER] Service IA:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (process.env.AI_SERVICE_URL) {
  console.log('Mode: Service IA Local');
  console.log('AI_SERVICE_URL:', process.env.AI_SERVICE_URL);
  console.log('AI_MODEL:', process.env.AI_MODEL || 'Non spécifié');
} else {
  console.log('Mode: OpenRouter API');
  console.log('OPENROUTER_API_URL:', process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1');
  console.log('OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? '✅ Défini' : '❌ NON DÉFINI');
  console.log('OPENROUTER_MODEL:', process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini');
}
console.log('AUTO_GENERATE_AI_SUMMARY:', process.env.AUTO_GENERATE_AI_SUMMARY || 'false');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n🌍 [SERVER] CORS & Frontend:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN || 'http://localhost:3000');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'http://localhost:3000');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Connexion à la base de données
connectDB();

const app = express();
const server = http.createServer(app);

// Configuration Socket.IO pour les notifications en temps réel
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Rendre io accessible dans toutes les routes
app.set('io', io);

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Nécessaire pour OIDC redirects
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Configuration des sessions pour OIDC
app.use(session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS en production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 heures
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  },
}));

// Initialiser Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes Google OAuth 2.0 (doivent être directement sous /auth)
app.use('/auth', require('./routes/auth-google'));

// Routes API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/ai', require('./routes/ai'));

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'LockHeaven API',
  });
});

// Gestion Socket.IO
io.on('connection', (socket) => {
  console.log('Nouveau client connecté:', socket.id);

  socket.on('authenticate', (token) => {
    // Vérifier le token JWT ici si nécessaire
    console.log('Client authentifié:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('Client déconnecté:', socket.id);
  });
});

// Gestionnaire d'erreurs
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('\n🎉 [SERVER] Serveur démarré avec succès!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🚀 Serveur HTTP: http://localhost:${PORT}`);
  console.log(`📡 WebSocket: ws://localhost:${PORT}`);
  console.log(`🔗 Document Store: ${process.env.MAYAN_API_URL || 'Non configuré'}`);
  console.log(`🤖 Service IA: ${process.env.AI_SERVICE_URL || process.env.OPENROUTER_API_URL || 'Non configuré'}`);
  console.log(`🌐 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n🔐 Routes d'authentification:`);
  console.log(`   - Google OAuth: http://localhost:${PORT}/auth/google`);
  console.log(`   - Callback: http://localhost:${PORT}/auth/google/callback`);
  console.log(`\n📚 API Routes:`);
  console.log(`   - Health: http://localhost:${PORT}/api/health`);
  console.log(`   - Documents: http://localhost:${PORT}/api/documents`);
  console.log(`   - Users: http://localhost:${PORT}/api/users`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});

module.exports = { app, io };

