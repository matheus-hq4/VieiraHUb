const crypto = require('crypto');
const { db, hashPassword } = require('./db');

// Armazenamento de sessões ativas com expiração (padrão 7 dias)
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const sessions = new Map();

class AuthController {
  // Autentica o usuário e gera um token de sessão
  static login(username, password) {
    const cleanUser = (username || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, error: 'Usuário e senha são obrigatórios.' };
    }

    const users = db.get('users');
    const user = users.find((u) => u.username.toLowerCase() === cleanUser);

    if (!user) {
      return { success: false, error: 'Usuário ou senha incorretos.' };
    }

    // Calcula o hash com o salt armazenado
    const computedHash = crypto.pbkdf2Sync(cleanPass, user.salt, 10000, 64, 'sha512').toString('hex');
    if (computedHash !== user.passwordHash) {
      return { success: false, error: 'Usuário ou senha incorretos.' };
    }

    // Gera token de sessão seguro
    const token = crypto.randomBytes(32).toString('hex');
    const userProfile = {
      id: user.id,
      username: user.username,
      name: user.name || user.username,
      role: user.role || 'operador'
    };

    sessions.set(token, {
      user: userProfile,
      expiresAt: Date.now() + SESSION_TTL_MS
    });

    return {
      success: true,
      token,
      user: userProfile
    };
  }

  // Destrói uma sessão
  static logout(token) {
    if (token && sessions.has(token)) {
      sessions.delete(token);
      return true;
    }
    return false;
  }

  // Valida um token e retorna a sessão
  static getSession(token) {
    if (!token || !sessions.has(token)) return null;

    const session = sessions.get(token);
    if (Date.now() > session.expiresAt) {
      sessions.delete(token);
      return null;
    }

    return session;
  }
}

// Middleware: Exige que o usuário esteja autenticado
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  let token = null;

  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'];
  }

  if (!token) {
    return res.status(401).json({ error: 'Acesso não autorizado. Faça login para continuar.' });
  }

  const session = AuthController.getSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Sessão expirada ou inválida. Por favor, entre novamente.' });
  }

  req.user = session.user;
  req.token = token;
  next();
}

// Middleware: Exige papel de Administrador ('admin')
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    return res.status(403).json({ error: 'Acesso negado. Esta operação requer privilégios de Administrador.' });
  });
}

module.exports = {
  AuthController,
  requireAuth,
  requireAdmin,
  hashPassword
};
