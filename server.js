const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

const { db, hashPassword } = require('./server/db');
const { AuthController, requireAuth, requireAdmin } = require('./server/auth');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// CORS middleware para permitir chamadas seguras na rede local
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-auth-token');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Bloqueio de segurança: impede acesso HTTP direto às pastas de banco e código privado
app.use(['/data', '/server', '/.env', '/.git', '/backup_principal', '/backup_v1', '/backup_v2'], (req, res) => {
  res.status(403).json({ error: 'Acesso proibido a diretórios internos do servidor.' });
});

// Servir arquivos estáticos (HTML, JS, CSS)
app.use(express.static(path.join(__dirname)));

// ==========================================
// 1. ROTAS DE AUTENTICAÇÃO E SESSÃO
// ==========================================

// Login com verificação no banco de dados do servidor
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const result = AuthController.login(username, password);

  if (!result.success) {
    return res.status(401).json({ error: result.error });
  }

  return res.json({
    token: result.token,
    user: result.user
  });
});

// Logout
app.post('/api/auth/logout', requireAuth, (req, res) => {
  AuthController.logout(req.token);
  return res.json({ success: true, message: 'Sessão encerrada com sucesso.' });
});

// Obter dados do usuário logado
app.get('/api/auth/me', requireAuth, (req, res) => {
  return res.json({ user: req.user });
});

// ==========================================
// 2. GESTÃO DE USUÁRIOS (APENAS ADMINISTRADOR)
// ==========================================

// Listar usuários da equipe de TI
app.get('/api/users', requireAdmin, (req, res) => {
  const users = db.get('users').map((u) => ({
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt
  }));
  return res.json(users);
});

// Criar novo usuário
app.post('/api/users', requireAdmin, (req, res) => {
  const { username, name, password, role } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
  }

  const cleanUser = username.trim().toLowerCase();
  const existing = db.get('users').find((u) => u.username.toLowerCase() === cleanUser);
  if (existing) {
    return res.status(409).json({ error: `O usuário "${cleanUser}" já está cadastrado.` });
  }

  const { hash, salt } = hashPassword(password);
  const newUser = {
    id: `usr-${Date.now()}`,
    username: cleanUser,
    name: name ? name.trim() : cleanUser,
    role: role === 'admin' ? 'admin' : 'operador',
    salt,
    passwordHash: hash,
    createdAt: new Date().toISOString()
  };

  db.insert('users', newUser);

  return res.status(201).json({
    id: newUser.id,
    username: newUser.username,
    name: newUser.name,
    role: newUser.role,
    createdAt: newUser.createdAt
  });
});

// Atualizar usuário
app.put('/api/users/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, role, password } = req.body || {};

  const user = db.findById('users', id);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  const updates = {};
  if (name) updates.name = name.trim();
  if (role) updates.role = role === 'admin' ? 'admin' : 'operador';
  if (password && password.trim()) {
    const { hash, salt } = hashPassword(password.trim());
    updates.passwordHash = hash;
    updates.salt = salt;
  }

  const updated = db.update('users', id, updates);
  return res.json({
    id: updated.id,
    username: updated.username,
    name: updated.name,
    role: updated.role
  });
});

// Excluir usuário
app.delete('/api/users/:id', requireAdmin, (req, res) => {
  const { id } = req.params;

  if (req.user.id === id) {
    return res.status(400).json({ error: 'Você não pode excluir sua própria conta enquanto conectado.' });
  }

  const success = db.delete('users', id);
  if (!success) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  return res.json({ success: true, message: 'Usuário removido com sucesso.' });
});

// ==========================================
// 3. LAUNCHPAD DE FERRAMENTAS & ACESSOS
// ==========================================

// Listar ferramentas
app.get('/api/tools', requireAuth, (req, res) => {
  return res.json(db.get('tools'));
});

// Salvar / Adicionar / Atualizar ferramentas em lote ou individual
app.post('/api/tools', requireAuth, (req, res) => {
  const payload = req.body;

  if (Array.isArray(payload)) {
    db.set('tools', payload);
    return res.json(payload);
  }

  if (typeof payload === 'object' && payload.name) {
    const newItem = db.insert('tools', payload);
    return res.status(201).json(newItem);
  }

  return res.status(400).json({ error: 'Formato de dados inválido para ferramentas.' });
});

// Atualizar ferramenta individual
app.put('/api/tools/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const updated = db.update('tools', id, req.body);
  if (!updated) return res.status(404).json({ error: 'Ferramenta não encontrada.' });
  return res.json(updated);
});

// Excluir ferramenta (apenas Administrador)
app.delete('/api/tools/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const success = db.delete('tools', id);
  if (!success) return res.status(404).json({ error: 'Ferramenta não encontrada.' });
  return res.json({ success: true });
});

// ==========================================
// 4. COFRE DE SENHAS CORPORATIVAS (PROTEGIDO)
// ==========================================

// Listar senhas do cofre
app.get('/api/vault', requireAuth, (req, res) => {
  return res.json(db.get('vault'));
});

// Adicionar nova senha
app.post('/api/vault', requireAuth, (req, res) => {
  const { title, category, username, password, notes } = req.body || {};

  if (!title || !password) {
    return res.status(400).json({ error: 'Título e senha são obrigatórios.' });
  }

  const newPass = db.insert('vault', {
    title: title.trim(),
    category: category || 'Wi-Fi',
    username: username ? username.trim() : '',
    password: password.trim(),
    notes: notes ? notes.trim() : '',
    updatedAt: new Date().toISOString().slice(0, 10)
  });

  return res.status(201).json(newPass);
});

// Atualizar senha
app.put('/api/vault/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body, updatedAt: new Date().toISOString().slice(0, 10) };
  const updated = db.update('vault', id, updates);

  if (!updated) return res.status(404).json({ error: 'Credencial não encontrada no cofre.' });
  return res.json(updated);
});

// Excluir senha do cofre (apenas Administrador)
app.delete('/api/vault/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const success = db.delete('vault', id);
  if (!success) return res.status(404).json({ error: 'Credencial não encontrada no cofre.' });
  return res.json({ success: true });
});

// ==========================================
// 5. CONTROLE DE ESTOQUE TI (PROTEGIDO)
// ==========================================

// Listar itens de estoque
app.get('/api/inventory', requireAuth, (req, res) => {
  return res.json(db.get('inventory'));
});

// Adicionar item de estoque
app.post('/api/inventory', requireAuth, (req, res) => {
  const { name, category, quantity, minQuantity, location, status, notes } = req.body || {};

  if (!name) {
    return res.status(400).json({ error: 'Nome do item é obrigatório.' });
  }

  const newItem = db.insert('inventory', {
    name: name.trim(),
    category: category || 'Periféricos',
    quantity: parseInt(quantity, 10) || 0,
    minQuantity: parseInt(minQuantity, 10) || 2,
    location: location ? location.trim() : 'Armário TI',
    status: status || 'Disponível',
    notes: notes ? notes.trim() : ''
  });

  return res.status(201).json(newItem);
});

// Atualizar item de estoque
app.put('/api/inventory/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const updated = db.update('inventory', id, req.body);
  if (!updated) return res.status(404).json({ error: 'Item de estoque não encontrado.' });
  return res.json(updated);
});

// Ajuste rápido de quantidade (+1 ou -1) - Liberado para qualquer técnico autenticado!
app.patch('/api/inventory/:id/qty', requireAuth, (req, res) => {
  const { id } = req.params;
  const { delta } = req.body || {};

  const item = db.findById('inventory', id);
  if (!item) return res.status(404).json({ error: 'Item não encontrado.' });

  const nextQty = Math.max(0, (item.quantity || 0) + (parseInt(delta, 10) || 0));
  const updated = db.update('inventory', id, { quantity: nextQty });

  return res.json(updated);
});

// Excluir item de estoque (apenas Administrador)
app.delete('/api/inventory/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const success = db.delete('inventory', id);
  if (!success) return res.status(404).json({ error: 'Item não encontrado.' });
  return res.json({ success: true });
});

// ==========================================
// 6. LOGINS ACTIVE DIRECTORY (PROTEGIDO)
// ==========================================

// Consultar logins do AD (exige autenticação no HUB)
app.get('/api/ad-logins', requireAuth, (req, res) => {
  const adData = db.get('ad_logins');
  return res.json({ rawText: adData.rawText || '' });
});

// Atualizar texto de mapeamento do AD (apenas Administrador)
app.post('/api/ad-logins', requireAdmin, (req, res) => {
  const { rawText } = req.body || {};
  if (typeof rawText !== 'string') {
    return res.status(400).json({ error: 'O formato do mapeamento deve ser texto.' });
  }

  db.set('ad_logins', { rawText });
  return res.json({ success: true, message: 'Mapeamento AD atualizado com sucesso no servidor.' });
});


// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Fallback para rota principal
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Inicialização do servidor em todas as interfaces de rede (0.0.0.0)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 VieiraTech HUB rodando com sucesso em http://localhost:${PORT}\n`);
});
