import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';
import { formatCurrency, formatDateBR, getStockStatus, nowIso } from './utils.js';
import { ensureSchema } from './schema.js';
import { seedDemoData } from './demoData.js';

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'ecoviva-secret-key';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token ausente ou inválido.' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido.' });
  }
}

function logAudit(action, metadata = {}, userId = null) {
  const stmt = db.prepare(`
    INSERT INTO audit_logs (user_id, action, details, created_at)
    VALUES (?, ?, ?, ?)
  `);

  stmt.run(userId, action, JSON.stringify(metadata), nowIso());
}

ensureSchema();
seedDemoData();

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Ecoviva API funcionando.' });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, {
    expiresIn: '8h',
  });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

app.get('/api/dashboard', requireAuth, (req, res) => {
  const totalItems = db.prepare('SELECT COUNT(*) as count FROM materials').get().count;
  const totalStockQty = db.prepare('SELECT COALESCE(SUM(current_stock), 0) as count FROM materials').get().count;
  const lowStock = db.prepare('SELECT COUNT(*) as count FROM materials WHERE current_stock <= minimum_stock').get().count;
  const emptyStock = db.prepare('SELECT COUNT(*) as count FROM materials WHERE current_stock <= 0').get().count;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthEntries = db.prepare(`
    SELECT COALESCE(SUM(quantity), 0) as count FROM stock_entries WHERE date >= ?
  `).get(monthStart.toISOString()).count;

  const monthOutputs = db.prepare(`
    SELECT COALESCE(SUM(quantity), 0) as count FROM stock_outputs WHERE date >= ?
  `).get(monthStart.toISOString()).count;

  const stockValue = db.prepare(`
    SELECT COALESCE(SUM(current_stock * unit_price), 0) as total FROM materials
  `).get().total;

  const lastMovements = db.prepare(`
    SELECT sm.*, m.description as material_name, u.name as user_name
    FROM stock_movements sm
    LEFT JOIN materials m ON m.id = sm.material_id
    LEFT JOIN users u ON u.id = sm.user_id
    ORDER BY sm.created_at DESC
    LIMIT 8
  `).all();

  const topUsed = db.prepare(`
    SELECT m.description, SUM(sm.quantity) as total
    FROM stock_movements sm
    LEFT JOIN materials m ON m.id = sm.material_id
    WHERE sm.type = 'SAÍDA'
    GROUP BY sm.material_id
    ORDER BY total DESC
    LIMIT 5
  `).all();

  const movementsByMonth = db.prepare(`
    SELECT strftime('%Y-%m', movement_date) as month, 
           SUM(CASE WHEN type = 'ENTRADA' THEN quantity ELSE 0 END) as entries,
           SUM(CASE WHEN type = 'SAÍDA' THEN quantity ELSE 0 END) as exits
    FROM stock_movements
    GROUP BY strftime('%Y-%m', movement_date)
    ORDER BY month DESC
    LIMIT 6
  `).all();

  const lowItems = db.prepare(`
    SELECT m.*, c.name as category_name, s.corporate_name as supplier_name
    FROM materials m
    LEFT JOIN categories c ON c.id = m.category_id
    LEFT JOIN suppliers s ON s.id = m.supplier_id
    WHERE m.current_stock <= m.minimum_stock
    ORDER BY m.current_stock ASC
    LIMIT 10
  `).all();

  res.json({
    totals: {
      totalItems,
      totalStockQty,
      lowStock,
      emptyStock,
      monthEntries,
      monthOutputs,
      stockValue,
    },
    lastMovements: lastMovements.map((movement) => ({
      ...movement,
      date: formatDateBR(movement.movement_date || movement.created_at),
      amount: movement.quantity,
      type: movement.type,
      currency: formatCurrency(movement.quantity * 0),
    })),
    topUsed,
    movementsByMonth,
    lowItems,
  });
});

app.get('/api/materials', requireAuth, (req, res) => {
  const materials = db.prepare(`
    SELECT m.*, c.name as category_name, l.name as location_name, s.corporate_name as supplier_name,
           CASE
             WHEN m.current_stock <= 0 THEN 'Sem estoque'
             WHEN m.current_stock <= m.minimum_stock THEN 'Estoque baixo'
             ELSE 'Estoque normal'
           END as status
    FROM materials m
    LEFT JOIN categories c ON c.id = m.category_id
    LEFT JOIN locations l ON l.id = m.location_id
    LEFT JOIN suppliers s ON s.id = m.supplier_id
    ORDER BY m.description ASC
  `).all();

  res.json(materials.map((m) => ({
    ...m,
    total_value: Number(m.current_stock || 0) * Number(m.unit_price || 0),
  })));
});

app.get('/api/materials/:id', requireAuth, (req, res) => {
  const material = db.prepare(`
    SELECT m.*, c.name as category_name, l.name as location_name, s.corporate_name as supplier_name
    FROM materials m
    LEFT JOIN categories c ON c.id = m.category_id
    LEFT JOIN locations l ON l.id = m.location_id
    LEFT JOIN suppliers s ON s.id = m.supplier_id
    WHERE m.id = ?
  `).get(req.params.id);

  if (!material) {
    return res.status(404).json({ error: 'Material não encontrado.' });
  }

  res.json({ ...material, total_value: Number(material.current_stock || 0) * Number(material.unit_price || 0) });
});

app.post('/api/materials', requireAuth, (req, res) => {
  const {
    code,
    internal_code,
    description,
    category_id,
    subcategory,
    unit,
    brand,
    model,
    current_stock,
    minimum_stock,
    maximum_stock,
    location_id,
    shelf,
    address,
    supplier_id,
    unit_price,
    observations,
    photo,
    barcode,
  } = req.body;

  if (!code || !description) {
    return res.status(400).json({ error: 'Código e descrição são obrigatórios.' });
  }

  const existing = db.prepare('SELECT id FROM materials WHERE code = ? OR barcode = ?').get(code, barcode || '');
  if (existing) {
    return res.status(400).json({ error: 'Já existe um material com este código ou código de barras.' });
  }

  const result = db.prepare(`
    INSERT INTO materials (code, internal_code, description, category_id, subcategory, unit, brand, model,
      current_stock, minimum_stock, maximum_stock, location_id, shelf, address, supplier_id, unit_price,
      observations, photo, barcode)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    code,
    internal_code || '',
    description,
    category_id || null,
    subcategory || '',
    unit || 'un',
    brand || '',
    model || '',
    Number(current_stock || 0),
    Number(minimum_stock || 0),
    Number(maximum_stock || 0),
    location_id || null,
    shelf || '',
    address || '',
    supplier_id || null,
    Number(unit_price || 0),
    observations || '',
    photo || '',
    barcode || '',
  );

  logAudit('CREATE_MATERIAL', { material_id: result.lastInsertRowid, description }, req.user.id);
  res.status(201).json({ id: result.lastInsertRowid, message: 'Material cadastrado com sucesso.' });
});

app.put('/api/materials/:id', requireAuth, (req, res) => {
  const { code, description, current_stock, minimum_stock, maximum_stock, unit_price } = req.body;

  const existing = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Material não encontrado.' });
  }

  db.prepare(`
    UPDATE materials
    SET code = ?, description = ?, current_stock = ?, minimum_stock = ?, maximum_stock = ?, unit_price = ?
    WHERE id = ?
  `).run(code || existing.code, description || existing.description, Number(current_stock || existing.current_stock), Number(minimum_stock || existing.minimum_stock), Number(maximum_stock || existing.maximum_stock), Number(unit_price || existing.unit_price), req.params.id);

  logAudit('UPDATE_MATERIAL', { material_id: req.params.id }, req.user.id);
  res.json({ message: 'Material atualizado com sucesso.' });
});

app.get('/api/categories', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM categories ORDER BY name ASC').all());
});

app.post('/api/categories', requireAuth, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome da categoria obrigatório.' });
  const result = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name.trim());
  logAudit('CREATE_CATEGORY', { name }, req.user.id);
  res.status(201).json({ id: result.lastInsertRowid, name: name.trim() });
});

app.get('/api/suppliers', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM suppliers ORDER BY corporate_name ASC').all());
});

app.post('/api/suppliers', requireAuth, (req, res) => {
  const { corporate_name, trade_name, cnpj, phone, email, address, city, state, contact, notes } = req.body;
  if (!corporate_name) return res.status(400).json({ error: 'Razão social obrigatória.' });

  const result = db.prepare(`
    INSERT INTO suppliers (corporate_name, trade_name, cnpj, phone, email, address, city, state, contact, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(corporate_name, trade_name || '', cnpj || '', phone || '', email || '', address || '', city || '', state || '', contact || '', notes || '');

  logAudit('CREATE_SUPPLIER', { supplier_id: result.lastInsertRowid, corporate_name }, req.user.id);
  res.status(201).json({ id: result.lastInsertRowid, corporate_name });
});

app.get('/api/works', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM works ORDER BY name ASC').all());
});

app.post('/api/works', requireAuth, (req, res) => {
  const { name, code, client, address, manager, start_date, forecast_end, status } = req.body;
  if (!name || !code) return res.status(400).json({ error: 'Nome e código da obra são obrigatórios.' });

  const result = db.prepare(`
    INSERT INTO works (name, code, client, address, manager, start_date, forecast_end, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, code, client || '', address || '', manager || '', start_date || '', forecast_end || '', status || 'Ativa');

  logAudit('CREATE_WORK', { work_id: result.lastInsertRowid, name }, req.user.id);
  res.status(201).json({ id: result.lastInsertRowid, name, code });
});

app.get('/api/locations', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM locations ORDER BY name ASC').all());
});

app.post('/api/locations', requireAuth, (req, res) => {
  const { name, shelf, address } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome da localização obrigatória.' });
  const result = db.prepare('INSERT INTO locations (name, shelf, address) VALUES (?, ?, ?)').run(name, shelf || '', address || '');
  logAudit('CREATE_LOCATION', { location_id: result.lastInsertRowid, name }, req.user.id);
  res.status(201).json({ id: result.lastInsertRowid, name });
});

app.get('/api/users', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT id, name, email, role, phone, active FROM users ORDER BY name ASC').all());
});

app.post('/api/users', requireAuth, (req, res) => {
  const { name, email, password, role, phone } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Nome, e-mail, senha e perfil são obrigatórios.' });
  }

  const hashed = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (name, email, password, role, phone, active)
    VALUES (?, ?, ?, ?, ?, 1)
  `).run(name, email.trim().toLowerCase(), hashed, role, phone || '');

  logAudit('CREATE_USER', { user_id: result.lastInsertRowid, email }, req.user.id);
  res.status(201).json({ id: result.lastInsertRowid, name, email, role });
});

app.post('/api/stock/entry', requireAuth, (req, res) => {
  const {
    material_id,
    date,
    invoice_number,
    supplier_id,
    quantity,
    unit,
    unit_price,
    total_value,
    lot,
    receiver,
    observations,
    attachment,
  } = req.body;

  if (!material_id || !quantity) {
    return res.status(400).json({ error: 'Material e quantidade são obrigatórios.' });
  }

  const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(material_id);
  if (!material) return res.status(404).json({ error: 'Material não encontrado.' });

  const prevStock = Number(material.current_stock || 0);
  const newStock = prevStock + Number(quantity);

  db.prepare('UPDATE materials SET current_stock = ? WHERE id = ?').run(newStock, material_id);

  const movement = db.prepare(`
    INSERT INTO stock_movements (type, material_id, quantity, previous_stock, current_stock, user_id, notes, related_document, movement_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('ENTRADA', material_id, Number(quantity), prevStock, newStock, req.user.id, observations || '', invoice_number || '', date || nowIso());

  db.prepare(`
    INSERT INTO stock_entries (material_id, date, invoice_number, supplier_id, quantity, unit, unit_price, total_value, lot, receiver, observations, attachment, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(material_id, date || nowIso(), invoice_number || '', supplier_id || null, Number(quantity), unit || material.unit, Number(unit_price || material.unit_price), Number(total_value || (Number(quantity) * Number(unit_price || material.unit_price))), lot || '', receiver || req.user.name, observations || '', attachment || '', req.user.id);

  logAudit('STOCK_ENTRY', { material_id, quantity, prevStock, newStock }, req.user.id);
  res.status(201).json({ message: 'Entrada registrada com sucesso.', movement_id: movement.lastInsertRowid, newStock });
});

app.post('/api/stock/output', requireAuth, (req, res) => {
  const {
    material_id,
    date,
    quantity,
    unit,
    work_id,
    sector,
    service,
    cost_center,
    employee,
    authorized_by,
    reason,
    observations,
  } = req.body;

  if (!material_id || !quantity) {
    return res.status(400).json({ error: 'Material e quantidade são obrigatórios.' });
  }

  const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(material_id);
  if (!material) return res.status(404).json({ error: 'Material não encontrado.' });

  const qty = Number(quantity);
  if (qty > Number(material.current_stock || 0)) {
    return res.status(400).json({ error: 'Quantidade superior ao estoque disponível.' });
  }

  const prevStock = Number(material.current_stock || 0);
  const newStock = prevStock - qty;

  db.prepare('UPDATE materials SET current_stock = ? WHERE id = ?').run(newStock, material_id);

  const movement = db.prepare(`
    INSERT INTO stock_movements (type, material_id, quantity, previous_stock, current_stock, user_id, notes, related_document, work_id, sector, movement_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('SAÍDA', material_id, qty, prevStock, newStock, req.user.id, observations || '', 'SAIDA', work_id || null, sector || '', date || nowIso());

  db.prepare(`
    INSERT INTO stock_outputs (material_id, date, quantity, unit, work_id, sector, service, cost_center, employee, authorized_by, reason, observations, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(material_id, date || nowIso(), qty, unit || material.unit, work_id || null, sector || '', service || '', cost_center || '', employee || '', authorized_by || '', reason || '', observations || '', req.user.id);

  logAudit('STOCK_OUTPUT', { material_id, quantity: qty, prevStock, newStock }, req.user.id);
  res.status(201).json({ message: 'Saída registrada com sucesso.', movement_id: movement.lastInsertRowid, newStock });
});

app.get('/api/movements', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT sm.*, m.description as material_name, u.name as user_name, w.name as work_name
    FROM stock_movements sm
    LEFT JOIN materials m ON m.id = sm.material_id
    LEFT JOIN users u ON u.id = sm.user_id
    LEFT JOIN works w ON w.id = sm.work_id
    ORDER BY sm.created_at DESC
  `).all();

  res.json(rows);
});

app.get('/api/requests', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT mr.*, m.description as material_name, w.name as work_name
    FROM material_requests mr
    LEFT JOIN materials m ON m.id = mr.material_id
    LEFT JOIN works w ON w.id = mr.work_id
    ORDER BY mr.created_at DESC
  `).all();

  res.json(rows);
});

app.post('/api/requests', requireAuth, (req, res) => {
  const { requester, work_id, sector, material_id, quantity, request_date, priority, notes } = req.body;
  if (!requester || !material_id || !quantity) {
    return res.status(400).json({ error: 'Solicitante, material e quantidade são obrigatórios.' });
  }

  const result = db.prepare(`
    INSERT INTO material_requests (requester, work_id, sector, material_id, quantity, request_date, priority, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pendente')
  `).run(requester, work_id || null, sector || '', material_id, Number(quantity), request_date || nowIso(), priority || 'Média', notes || '');

  logAudit('CREATE_REQUEST', { request_id: result.lastInsertRowid }, req.user.id);
  res.status(201).json({ id: result.lastInsertRowid, message: 'Solicitação registrada.' });
});

app.put('/api/requests/:id/status', requireAuth, (req, res) => {
  const { status } = req.body;
  const result = db.prepare('UPDATE material_requests SET status = ? WHERE id = ?').run(status, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Solicitação não encontrada.' });

  if (status === 'Aprovada') {
    logAudit('REQUEST_APPROVED', { request_id: req.params.id }, req.user.id);
  }

  res.json({ message: 'Status atualizado.' });
});

app.get('/api/reports/summary', requireAuth, (req, res) => {
  const reports = {
    materials: db.prepare('SELECT COUNT(*) as count FROM materials').get().count,
    stockValue: db.prepare('SELECT COALESCE(SUM(current_stock * unit_price),0) as total FROM materials').get().total,
    lowStock: db.prepare('SELECT COUNT(*) as count FROM materials WHERE current_stock <= minimum_stock').get().count,
    entries: db.prepare('SELECT COALESCE(SUM(quantity),0) as total FROM stock_entries').get().total,
    outputs: db.prepare('SELECT COALESCE(SUM(quantity),0) as total FROM stock_outputs').get().total,
  };

  res.json(reports);
});

app.get('/api/audit', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT a.*, u.name as user_name
    FROM audit_logs a
    LEFT JOIN users u ON u.id = a.user_id
    ORDER BY a.created_at DESC
    LIMIT 50
  `).all();
  res.json(rows);
});

app.get('/api/bootstrap', requireAuth, (req, res) => {
  const users = db.prepare('SELECT id, name, email, role FROM users ORDER BY name ASC').all();
  const materials = db.prepare('SELECT id, code, description, current_stock, minimum_stock FROM materials ORDER BY description ASC').all();
  const categories = db.prepare('SELECT id, name FROM categories ORDER BY name ASC').all();
  const works = db.prepare('SELECT id, name, code FROM works ORDER BY name ASC').all();
  const suppliers = db.prepare('SELECT id, corporate_name FROM suppliers ORDER BY corporate_name ASC').all();
  const locations = db.prepare('SELECT id, name FROM locations ORDER BY name ASC').all();

  res.json({ users, materials, categories, works, suppliers, locations });
});

app.listen(port, () => {
  console.log(`Servidor Ecoviva rodando em http://localhost:${port}`);
});
