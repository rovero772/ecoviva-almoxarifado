import bcrypt from 'bcryptjs';
import db from './db.js';
import { ensureSchema } from './schema.js';

ensureSchema();

const categories = [
  'Cimento',
  'Areia',
  'Pedra',
  'Blocos',
  'Tijolos',
  'Argamassa',
  'Aço',
  'Ferragens',
  'Tubos',
  'Conexões',
  'Material hidráulico',
  'Material elétrico',
  'Ferramentas',
  'EPIs',
  'Madeira',
  'Materiais de acabamento',
  'Outros',
];

for (const name of categories) {
  db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)').run(name);
}

const supplierInsert = db.prepare(`
  INSERT OR IGNORE INTO suppliers (corporate_name, trade_name, cnpj, phone, email, address, city, state, contact, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

supplierInsert.run('Construtora Vale e Rocha LTDA', 'Vale Rocha', '12.345.678/0001-99', '(11) 99999-0001', 'contato@valerocha.com.br', 'Rua das Pedras, 120', 'São Paulo', 'SP', 'Carlos', 'Fornecedor principal de materiais de obra');
supplierInsert.run('Materiais Alfa Construções', 'Alfa', '98.765.432/0001-88', '(11) 98888-0011', 'vendas@alfa.com.br', 'Av. Industrial, 75', 'Campinas', 'SP', 'Renata', 'Fundações e ferragens');

const worksInsert = db.prepare(`
  INSERT OR IGNORE INTO works (name, code, client, address, manager, start_date, forecast_end, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
worksInsert.run('Residencial Morada Nova', 'OBRA-001', 'Sônia Almeida', 'Rua Nova, 300', 'João Pereira', '2026-01-10', '2026-12-30', 'Ativa');
worksInsert.run('Edifício Centro Sul', 'OBRA-002', 'Nexus Imóveis', 'Av. Central, 1400', 'Marcos Silva', '2026-02-01', '2026-11-15', 'Ativa');

const locationsInsert = db.prepare('INSERT OR IGNORE INTO locations (name, shelf, address) VALUES (?, ?, ?)');
locationsInsert.run('Depósito Central', 'A1', 'Galpão principal');
locationsInsert.run('Pátio Externo', 'B2', 'Lado norte');
locationsInsert.run('Setor Elétrica', 'C3', 'Bloco 2');

const usersInsert = db.prepare(`
  INSERT OR IGNORE INTO users (name, email, password, role, phone, active)
  VALUES (?, ?, ?, ?, ?, 1)
`);
usersInsert.run('Administrador', 'admin@ecoviva.com', bcrypt.hashSync('admin123', 10), 'Administrador', '(11) 90000-0000');
usersInsert.run('Almoxarife', 'almoxarife@ecoviva.com', bcrypt.hashSync('almox123', 10), 'Almoxarife', '(11) 90000-0001');
usersInsert.run('Engenharia', 'engenharia@ecoviva.com', bcrypt.hashSync('eng123', 10), 'Engenharia', '(11) 90000-0002');
usersInsert.run('Consulta', 'consulta@ecoviva.com', bcrypt.hashSync('cons123', 10), 'Consulta', '(11) 90000-0003');

const materialsInsert = db.prepare(`
  INSERT OR IGNORE INTO materials (code, internal_code, description, category_id, subcategory, unit, brand, model, current_stock, minimum_stock, maximum_stock, location_id, shelf, address, supplier_id, unit_price, barcode)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const categoryMap = Object.fromEntries(db.prepare('SELECT id, name FROM categories').all().map((c) => [c.name, c.id]));
const supplierMap = Object.fromEntries(db.prepare('SELECT id, corporate_name FROM suppliers').all().map((s) => [s.corporate_name, s.id]));
const locationMap = Object.fromEntries(db.prepare('SELECT id, name FROM locations').all().map((l) => [l.name, l.id]));

materialsInsert.run('MAT-001', 'INT-001', 'Cimento CP II 32', categoryMap['Cimento'], 'Cimento Portland', 'saco', 'Votorantim', 'CP II 32', 220, 40, 500, locationMap['Depósito Central'], 'A1', 'Galpão principal', supplierMap['Construtora Vale e Rocha LTDA'], 42.5, '789123456001');
materialsInsert.run('MAT-002', 'INT-002', 'Areia lavada', categoryMap['Areia'], 'Areia fina', 'm³', 'Local', 'Lavada', 18, 8, 40, locationMap['Depósito Central'], 'A2', 'Galpão principal', supplierMap['Construtora Vale e Rocha LTDA'], 95, '789123456002');
materialsInsert.run('MAT-003', 'INT-003', 'Tijolo cerâmico 6 furos', categoryMap['Tijolos'], 'Cerâmica', 'un', 'Ceramica X', '6 furos', 880, 200, 1200, locationMap['Pátio Externo'], 'B1', 'Pátio', supplierMap['Materiais Alfa Construções'], 1.8, '789123456003');
materialsInsert.run('MAT-004', 'INT-004', 'Bloco estrutural 14x19x39', categoryMap['Blocos'], 'Estrutural', 'un', 'Bloco Plus', '14x19x39', 640, 180, 800, locationMap['Pátio Externo'], 'B2', 'Área externa', supplierMap['Materiais Alfa Construções'], 3.4, '789123456004');
materialsInsert.run('MAT-005', 'INT-005', 'Ferragem CA-50 10mm', categoryMap['Ferragens'], 'Aço', 'kg', 'Aço Forte', 'CA-50', 230, 60, 500, locationMap['Depósito Central'], 'A3', 'Corredor 3', supplierMap['Materiais Alfa Construções'], 9.5, '789123456005');
materialsInsert.run('MAT-006', 'INT-006', 'Tubos PVC 40mm', categoryMap['Tubos'], 'Hidráulico', 'm', 'PVC Max', '40mm', 150, 30, 300, locationMap['Setor Elétrica'], 'C1', 'Setor hidráulico', supplierMap['Construtora Vale e Rocha LTDA'], 12.2, '789123456006');
materialsInsert.run('MAT-007', 'INT-007', 'Conexão de pressão 1"', categoryMap['Conexões'], 'Hidráulico', 'un', 'Pressão Plus', '1"', 44, 20, 120, locationMap['Setor Elétrica'], 'C2', 'Setor hidráulico', supplierMap['Construtora Vale e Rocha LTDA'], 7.8, '789123456007');
materialsInsert.run('MAT-008', 'INT-008', 'Fita isolante 3M', categoryMap['Material elétrico'], 'Elétrica', 'un', '3M', 'Isolante', 65, 25, 200, locationMap['Setor Elétrica'], 'C3', 'Setor elétrica', supplierMap['Materiais Alfa Construções'], 18.9, '789123456008');
materialsInsert.run('MAT-009', 'INT-009', 'Martelo de encanador', categoryMap['Ferramentas'], 'Manual', 'un', 'Tramontina', 'M-350', 18, 8, 40, locationMap['Depósito Central'], 'D1', 'Ferramentas', supplierMap['Construtora Vale e Rocha LTDA'], 79, '789123456009');
materialsInsert.run('MAT-010', 'INT-010', 'Capacete de segurança', categoryMap['EPIs'], 'Proteção', 'un', 'Bunker', 'Padrão', 32, 25, 100, locationMap['Depósito Central'], 'D2', 'EPIs', supplierMap['Materiais Alfa Construções'], 24.5, '789123456010');

const requestsInsert = db.prepare(`
  INSERT OR IGNORE INTO material_requests (requester, work_id, sector, material_id, quantity, request_date, priority, notes, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
requestsInsert.run('Roberto', 1, 'Estrutura', 5, 12, '2026-09-20', 'Alta', 'Necessário para reforço de pilares', 'Pendente');
requestsInsert.run('Marina', 2, 'Hidráulica', 6, 30, '2026-09-21', 'Média', 'Entrega urgente para execução do banheiro', 'Aprovada');

console.log('Seed executado com sucesso.');
