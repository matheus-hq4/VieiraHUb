const express = require('express');
const path = require('path');
const net = require('net');
const http = require('http');
const https = require('https');
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

// Registrar acesso / clique na ferramenta (incrementa accessCount em tempo real)
app.post('/api/tools/:id/access', requireAuth, (req, res) => {
  const { id } = req.params;
  const tool = db.findById('tools', id);
  if (!tool) return res.status(404).json({ error: 'Ferramenta não encontrada.' });

  const accessCount = (tool.accessCount || 0) + 1;
  const lastAccessedAt = new Date().toISOString();
  const updated = db.update('tools', id, { accessCount, lastAccessedAt });

  return res.json({ id: updated.id, accessCount: updated.accessCount, lastAccessedAt });
});

// Helper de teste de conectividade (TCP Socket com timeout seguro)
function testConnectivity(target, portOverride, timeoutMs = 2000) {
  return new Promise((resolve) => {
    const start = Date.now();
    let host = target || '';
    let port = portOverride ? parseInt(portOverride, 10) : null;

    // Se vier http:// ou https://, extrai host e porta
    try {
      if (host.includes('://')) {
        const u = new URL(host);
        host = u.hostname;
        if (!port && u.port) port = parseInt(u.port, 10);
        if (!port) port = u.protocol === 'https:' ? 443 : 80;
      } else if (host.includes(':')) {
        const parts = host.split(':');
        host = parts[0];
        if (!port && parts[1]) port = parseInt(parts[1], 10);
      }
    } catch {
      // Ignora erro de parse e segue com fallback
    }

    if (!port) port = 80;
    host = host.trim();

    if (!host) {
      return resolve({ status: 'offline', latency: 0, error: 'Endereço vazio' });
    }

    const socket = new net.Socket();
    let resolved = false;

    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      if (!resolved) {
        resolved = true;
        const latency = Date.now() - start;
        socket.destroy();
        resolve({ status: 'online', latency, host, port });
      }
    });

    socket.on('timeout', () => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        resolve({ status: 'offline', latency: timeoutMs, error: 'Tempo limite excedido', host, port });
      }
    });

    socket.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        // Em rede local, 'ECONNREFUSED' significa que a máquina/IP está ONLINE e respondeu na camada TCP!
        if (err.code === 'ECONNREFUSED') {
          resolve({ status: 'online', latency: Date.now() - start, note: 'Host respondeu (porta fechada)', host, port });
        } else {
          resolve({ status: 'offline', latency: Date.now() - start, error: err.code || 'Falha de conexão', host, port });
        }
      }
    });

    try {
      socket.connect(port, host);
    } catch (e) {
      if (!resolved) {
        resolved = true;
        resolve({ status: 'offline', latency: 0, error: e.message, host, port });
      }
    }
  });
}

// Testar conectividade de uma ferramenta individual
app.get('/api/tools/:id/ping', requireAuth, async (req, res) => {
  const { id } = req.params;
  const tool = db.findById('tools', id);
  if (!tool) return res.status(404).json({ error: 'Ferramenta não encontrada.' });

  const result = await testConnectivity(tool.url_or_ip, tool.port);
  db.update('tools', id, {
    status: result.status,
    latency: result.latency,
    lastPingAt: new Date().toISOString()
  });

  return res.json({ id, ...result });
});

// Testar conectividade em lote (todas ou lista de IDs)
app.post('/api/tools/ping-batch', requireAuth, async (req, res) => {
  const tools = db.get('tools');
  const results = {};

  // Limita até 15 testes paralelos para não sobrecarregar
  const batch = tools.slice(0, 20);
  await Promise.all(
    batch.map(async (t) => {
      const res = await testConnectivity(t.url_or_ip, t.port, 1500);
      results[t.id] = res;
      db.update('tools', t.id, {
        status: res.status,
        latency: res.latency,
        lastPingAt: new Date().toISOString()
      });
    })
  );

  return res.json(results);
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
  const current = db.findById('inventory', id);
  if (!current) return res.status(404).json({ error: 'Item de estoque não encontrado.' });

  const updated = db.update('inventory', id, req.body);

  // Se a quantidade foi alterada via edição direta, registra log
  if (req.body.quantity !== undefined && parseInt(req.body.quantity, 10) !== current.quantity) {
    const newQty = parseInt(req.body.quantity, 10);
    const delta = newQty - current.quantity;
    db.insert('inventory_logs', {
      itemId: id,
      itemName: updated.name || current.name,
      previousQty: current.quantity,
      newQty,
      delta,
      action: delta > 0 ? 'entrada' : 'saida',
      user: req.user ? (req.user.name || req.user.username) : 'Técnico TI',
      reason: req.body.reason || 'Ajuste manual via edição',
      timestamp: new Date().toISOString()
    });
  }

  return res.json(updated);
});

// Ajuste rápido de quantidade (+1 ou -1) com auditoria
app.patch('/api/inventory/:id/qty', requireAuth, (req, res) => {
  const { id } = req.params;
  const { delta, reason } = req.body || {};

  const item = db.findById('inventory', id);
  if (!item) return res.status(404).json({ error: 'Item não encontrado.' });

  const numDelta = parseInt(delta, 10) || 0;
  const nextQty = Math.max(0, (item.quantity || 0) + numDelta);
  const updated = db.update('inventory', id, { quantity: nextQty });

  // Grava log de auditoria
  db.insert('inventory_logs', {
    itemId: id,
    itemName: item.name,
    previousQty: item.quantity,
    newQty: nextQty,
    delta: numDelta,
    action: numDelta > 0 ? 'entrada' : 'saida',
    user: req.user ? (req.user.name || req.user.username) : 'Técnico TI',
    reason: reason || (numDelta > 0 ? 'Entrada rápida no estoque (+1)' : 'Baixa rápida no estoque (-1)'),
    timestamp: new Date().toISOString()
  });

  return res.json(updated);
});

// Listar histórico de movimentações (auditoria)
app.get('/api/inventory/logs', requireAuth, (req, res) => {
  const logs = db.get('inventory_logs') || [];
  const limit = parseInt(req.query.limit, 10) || 50;
  const sorted = [...logs].reverse().slice(0, limit);
  return res.json(sorted);
});

// Excluir item de estoque (apenas Administrador)
app.delete('/api/inventory/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const item = db.findById('inventory', id);
  const success = db.delete('inventory', id);
  if (!success) return res.status(404).json({ error: 'Item não encontrado.' });

  if (item) {
    db.insert('inventory_logs', {
      itemId: id,
      itemName: item.name,
      previousQty: item.quantity,
      newQty: 0,
      delta: -item.quantity,
      action: 'exclusao',
      user: req.user ? (req.user.name || req.user.username) : 'Administrador',
      reason: 'Item removido do inventário',
      timestamp: new Date().toISOString()
    });
  }

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

// Atualizar texto de mapeamento do AD (equipe autenticada de TI)
app.post('/api/ad-logins', requireAuth, (req, res) => {
  const { rawText } = req.body || {};
  if (typeof rawText !== 'string') {
    return res.status(400).json({ error: 'O formato do mapeamento deve ser texto.' });
  }

  db.set('ad_logins', { rawText });
  return res.json({ success: true, message: 'Mapeamento AD atualizado com sucesso no servidor.' });
});


// ==========================================
// 7. BACKUP DO SISTEMA (APENAS ADMINISTRADOR)
// ==========================================

// Download direto do snapshot do banco de dados (JSON)
app.get('/api/admin/backup', requireAdmin, (req, res) => {
  try {
    const data = db.read();
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `vieiratech_hub_backup_${dateStr}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('[Backup] Erro ao gerar backup:', e);
    return res.status(500).json({ error: 'Erro ao gerar backup no servidor.' });
  }
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
