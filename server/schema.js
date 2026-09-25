import db from './db.js';

export function ensureSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('Administrador','Almoxarife','Engenharia','Consulta')),
      phone TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      corporate_name TEXT NOT NULL,
      trade_name TEXT,
      cnpj TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      contact TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS works (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      client TEXT,
      address TEXT,
      manager TEXT,
      start_date TEXT,
      forecast_end TEXT,
      status TEXT DEFAULT 'Ativa',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      shelf TEXT,
      address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      internal_code TEXT,
      description TEXT NOT NULL,
      category_id INTEGER,
      subcategory TEXT,
      unit TEXT,
      brand TEXT,
      model TEXT,
      current_stock REAL DEFAULT 0,
      minimum_stock REAL DEFAULT 0,
      maximum_stock REAL DEFAULT 0,
      location_id INTEGER,
      shelf TEXT,
      address TEXT,
      supplier_id INTEGER,
      unit_price REAL DEFAULT 0,
      observations TEXT,
      photo TEXT,
      barcode TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(category_id) REFERENCES categories(id),
      FOREIGN KEY(location_id) REFERENCES locations(id),
      FOREIGN KEY(supplier_id) REFERENCES suppliers(id)
    );

    CREATE TABLE IF NOT EXISTS stock_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      invoice_number TEXT,
      supplier_id INTEGER,
      quantity REAL NOT NULL,
      unit TEXT,
      unit_price REAL,
      total_value REAL,
      lot TEXT,
      receiver TEXT,
      observations TEXT,
      attachment TEXT,
      user_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(material_id) REFERENCES materials(id),
      FOREIGN KEY(supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS stock_outputs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT,
      work_id INTEGER,
      sector TEXT,
      service TEXT,
      cost_center TEXT,
      employee TEXT,
      authorized_by TEXT,
      reason TEXT,
      observations TEXT,
      user_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(material_id) REFERENCES materials(id),
      FOREIGN KEY(work_id) REFERENCES works(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('ENTRADA','SAÍDA','AJUSTE')),
      material_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      previous_stock REAL NOT NULL,
      current_stock REAL NOT NULL,
      user_id INTEGER,
      notes TEXT,
      related_document TEXT,
      work_id INTEGER,
      sector TEXT,
      movement_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(material_id) REFERENCES materials(id),
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(work_id) REFERENCES works(id)
    );

    CREATE TABLE IF NOT EXISTS material_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requester TEXT NOT NULL,
      work_id INTEGER,
      sector TEXT,
      material_id INTEGER,
      quantity REAL NOT NULL,
      request_date TEXT,
      priority TEXT DEFAULT 'Média',
      notes TEXT,
      status TEXT DEFAULT 'Pendente' CHECK(status IN ('Pendente','Aprovada','Separando','Entregue','Recusada','Cancelada')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(work_id) REFERENCES works(id),
      FOREIGN KEY(material_id) REFERENCES materials(id)
    );

    CREATE TABLE IF NOT EXISTS inventories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_id INTEGER,
      title TEXT,
      status TEXT DEFAULT 'Aberto',
      started_by INTEGER,
      started_at TEXT,
      closed_at TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(work_id) REFERENCES works(id),
      FOREIGN KEY(started_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS inventory_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inventory_id INTEGER,
      material_id INTEGER,
      system_quantity REAL,
      physical_quantity REAL,
      difference REAL,
      justification TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(inventory_id) REFERENCES inventories(id),
      FOREIGN KEY(material_id) REFERENCES materials(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);
}
