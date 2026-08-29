import express from 'express';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

const DATA_DIR = join(__dirname, 'data');
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR);

const BACKUP_DIR = join(__dirname, 'backups');
if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR);

const BACKUP_FILES = ['wines', 'orders', 'contacts', 'receptions', 'categories', 'liquidaciones'];
const MAX_BACKUPS = 7;

// ── Caché en memoria ──────────────────────────────────────────────────────────

function loadFile(name) {
  const p = join(DATA_DIR, `${name}.json`);
  if (!existsSync(p)) return [];
  return JSON.parse(readFileSync(p, 'utf-8'));
}

function saveFile(name, data) {
  writeFileSync(join(DATA_DIR, `${name}.json`), JSON.stringify(data, null, 2));
}

const db = {
  wines:        loadFile('wines'),
  orders:       loadFile('orders'),
  contacts:     loadFile('contacts'),
  receptions:   loadFile('receptions'),
  categories:   loadFile('categories'),
  liquidaciones: loadFile('liquidaciones'),
};

function save(name) {
  saveFile(name, db[name]);
}

// ── Backup diario ─────────────────────────────────────────────────────────────

function createDailyBackup() {
  const date = new Date().toISOString().slice(0, 10);
  const backupPath = join(BACKUP_DIR, `bda-backup-${date}.json`);
  if (existsSync(backupPath)) return;
  const backup = { version: 1, exportedAt: new Date().toISOString() };
  for (const name of BACKUP_FILES) backup[name] = db[name];
  writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log(`Backup automático creado: bda-backup-${date}.json`);
  const all = readdirSync(BACKUP_DIR).filter(f => f.startsWith('bda-backup-')).sort();
  while (all.length > MAX_BACKUPS) {
    unlinkSync(join(BACKUP_DIR, all.shift()));
  }
}

setImmediate(createDailyBackup);
setInterval(createDailyBackup, 24 * 60 * 60 * 1000);

// ── Seed categorías (primera vez) ─────────────────────────────────────────────

if (db.categories.length === 0) {
  db.categories = [
    { id: 'tinto',     label: 'Tinto',      color: 'bg-red-100 text-red-800 border-red-200' },
    { id: 'blanco',    label: 'Blanco',     color: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
    { id: 'rosado',    label: 'Rosado',     color: 'bg-pink-100 text-pink-700 border-pink-200' },
    { id: 'espumante', label: 'Espumante',  color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { id: 'dulce',     label: 'Dulce',      color: 'bg-amber-100 text-amber-800 border-amber-200' },
    { id: 'otro',      label: 'Otro',       color: 'bg-gray-100 text-gray-700 border-gray-200' },
  ];
  save('categories');
}

// ── Seed vinos (primera vez) ──────────────────────────────────────────────────

if (db.wines.length === 0) {
  db.wines = [
    { id: 'w1', code: 'MAL-RES-21', name: 'Malbec Reserva', category: 'tinto', vintage: 2021, region: 'Mendoza', winery: 'Achaval Ferrer', varietal: 'Malbec', stock: 48, bottlesPerCase: 6, prices: { bottle: 3500, case: 18000, market: 5200 }, notes: '', createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
    { id: 'w2', code: 'CHAR-VU-22', name: 'Chardonnay Gran Reserva', category: 'blanco', vintage: 2022, region: 'Valle de Uco', winery: 'Zuccardi', varietal: 'Chardonnay', stock: 24, bottlesPerCase: 6, prices: { bottle: 2800, case: 14400, market: 4100 }, notes: '', createdAt: '2024-01-16T10:00:00Z', updatedAt: '2024-01-16T10:00:00Z' },
    { id: 'w3', code: 'CAB-SJ-20', name: 'Cabernet Sauvignon', category: 'tinto', vintage: 2020, region: 'San Juan', winery: 'Callia', varietal: 'Cabernet Sauvignon', stock: 60, bottlesPerCase: 12, prices: { bottle: 2200, case: 22000, market: 3400 }, notes: '', createdAt: '2024-01-17T10:00:00Z', updatedAt: '2024-01-17T10:00:00Z' },
    { id: 'w4', code: 'TOR-SAL-23', name: 'Torrontés Clásico', category: 'blanco', vintage: 2023, region: 'Salta', winery: 'Michel Torino', varietal: 'Torrontés', stock: 36, bottlesPerCase: 6, prices: { bottle: 1800, case: 9000, market: 2600 }, notes: '', createdAt: '2024-01-18T10:00:00Z', updatedAt: '2024-01-18T10:00:00Z' },
    { id: 'w5', code: 'MER-LUJ-21', name: 'Merlot Luján', category: 'tinto', vintage: 2021, region: 'Luján de Cuyo', winery: 'Catena Zapata', varietal: 'Merlot', stock: 18, bottlesPerCase: 6, prices: { bottle: 4200, case: 21600, market: 6000 }, notes: '', createdAt: '2024-01-19T10:00:00Z', updatedAt: '2024-01-21T10:00:00Z' },
    { id: 'w6', code: 'PIN-PAT-22', name: 'Pinot Noir Patagonia', category: 'tinto', vintage: 2022, region: 'Patagonia', winery: 'Chacra', varietal: 'Pinot Noir', stock: 12, bottlesPerCase: 6, prices: { bottle: 5500, case: 28500, market: 8200 }, notes: '', createdAt: '2024-01-20T10:00:00Z', updatedAt: '2024-01-20T10:00:00Z' },
    { id: 'w7', code: 'BRUT-MZA-22', name: 'Brut Nature Extra', category: 'espumante', vintage: 2022, region: 'Mendoza', winery: 'Chandon', varietal: 'Chardonnay/Pinot Noir', stock: 30, bottlesPerCase: 6, prices: { bottle: 3200, case: 16800, market: 4800 }, notes: '', createdAt: '2024-01-21T10:00:00Z', updatedAt: '2024-01-21T10:00:00Z' },
    { id: 'w8', code: 'ROS-MZA-23', name: 'Rosado de Malbec', category: 'rosado', vintage: 2023, region: 'Mendoza', winery: 'Trapiche', varietal: 'Malbec', stock: 6, bottlesPerCase: 6, prices: { bottle: 1600, case: 8400, market: 2400 }, notes: 'Pocas unidades', createdAt: '2024-01-22T10:00:00Z', updatedAt: '2024-01-22T10:00:00Z' },
  ];
  save('wines');
}

// ── Wines ─────────────────────────────────────────────────────────────────────

app.get('/api/wines', (_req, res) => res.json(db.wines));

app.post('/api/wines', (req, res) => {
  db.wines.push(req.body);
  save('wines');
  res.json(req.body);
});

app.put('/api/wines/:id', (req, res) => {
  db.wines = db.wines.map((w) => (w.id === req.params.id ? req.body : w));
  save('wines');
  res.json(req.body);
});

app.delete('/api/wines/:id', (req, res) => {
  db.wines = db.wines.filter((w) => w.id !== req.params.id);
  save('wines');
  res.json({ ok: true });
});

app.patch('/api/wines/:id/stock', (req, res) => {
  const { delta } = req.body;
  let updated;
  db.wines = db.wines.map((w) => {
    if (w.id !== req.params.id) return w;
    updated = { ...w, stock: Math.max(0, w.stock + delta), updatedAt: new Date().toISOString() };
    return updated;
  });
  save('wines');
  res.json(updated);
});

app.patch('/api/wines/:id/prices', (req, res) => {
  const { prices } = req.body;
  let updated;
  db.wines = db.wines.map((w) => {
    if (w.id !== req.params.id) return w;
    updated = { ...w, prices, updatedAt: new Date().toISOString() };
    return updated;
  });
  save('wines');
  res.json(updated);
});

// ── Orders ────────────────────────────────────────────────────────────────────

app.get('/api/orders', (_req, res) => res.json(db.orders));

app.post('/api/orders', (req, res) => {
  db.orders.unshift(req.body);
  save('orders');
  res.json(req.body);
});

app.put('/api/orders/:id', (req, res) => {
  db.orders = db.orders.map((o) => (o.id === req.params.id ? req.body : o));
  save('orders');
  res.json(req.body);
});

app.patch('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  let updated;
  db.orders = db.orders.map((o) => {
    if (o.id !== req.params.id) return o;
    updated = { ...o, status };
    return updated;
  });
  save('orders');
  res.json(updated);
});

app.delete('/api/orders/:id', (req, res) => {
  db.orders = db.orders.filter((o) => o.id !== req.params.id);
  save('orders');
  res.json({ ok: true });
});

// ── Contacts ──────────────────────────────────────────────────────────────────

app.get('/api/contacts', (_req, res) => res.json(db.contacts));

app.post('/api/contacts', (req, res) => {
  db.contacts.push(req.body);
  save('contacts');
  res.json(req.body);
});

app.put('/api/contacts/:id', (req, res) => {
  db.contacts = db.contacts.map((c) => (c.id === req.params.id ? req.body : c));
  save('contacts');
  res.json(req.body);
});

app.delete('/api/contacts/:id', (req, res) => {
  db.contacts = db.contacts.filter((c) => c.id !== req.params.id);
  save('contacts');
  res.json({ ok: true });
});

// ── Categories ────────────────────────────────────────────────────────────────

app.get('/api/categories', (_req, res) => res.json(db.categories));

app.post('/api/categories', (req, res) => {
  db.categories.push(req.body);
  save('categories');
  res.json(req.body);
});

app.put('/api/categories/:id', (req, res) => {
  db.categories = db.categories.map((c) => (c.id === req.params.id ? req.body : c));
  save('categories');
  res.json(req.body);
});

app.delete('/api/categories/:id', (req, res) => {
  db.categories = db.categories.filter((c) => c.id !== req.params.id);
  save('categories');
  res.json({ ok: true });
});

// ── Receptions ────────────────────────────────────────────────────────────────

app.get('/api/receptions', (_req, res) => res.json(db.receptions));

app.post('/api/receptions', (req, res) => {
  db.receptions.unshift(req.body);
  save('receptions');
  res.json(req.body);
});

app.delete('/api/receptions/:id', (req, res) => {
  db.receptions = db.receptions.filter((r) => r.id !== req.params.id);
  save('receptions');
  res.json({ ok: true });
});

// ── Liquidaciones ─────────────────────────────────────────────────────────────

app.get('/api/liquidaciones', (_req, res) => res.json(db.liquidaciones));

app.post('/api/liquidaciones', (req, res) => {
  db.liquidaciones.unshift(req.body);
  save('liquidaciones');
  res.json(req.body);
});

app.put('/api/liquidaciones/:id', (req, res) => {
  db.liquidaciones = db.liquidaciones.map((l) => (l.id === req.params.id ? req.body : l));
  save('liquidaciones');
  res.json(req.body);
});

app.delete('/api/liquidaciones/:id', (req, res) => {
  db.liquidaciones = db.liquidaciones.filter((l) => l.id !== req.params.id);
  save('liquidaciones');
  res.json({ ok: true });
});

// ── Backup / Restore ──────────────────────────────────────────────────────────

app.get('/api/backup', (_req, res) => {
  res.json({ version: 1, exportedAt: new Date().toISOString(), ...db });
});

app.post('/api/restore', (req, res) => {
  const { version, exportedAt, ...data } = req.body;
  for (const name of BACKUP_FILES) {
    if (Array.isArray(data[name])) {
      db[name] = data[name];
      save(name);
    }
  }
  res.json({ ok: true });
});

// ── React app ─────────────────────────────────────────────────────────────────

app.use(express.static(join(__dirname, 'dist')));
app.get('/{*path}', (_req, res) => res.sendFile(join(__dirname, 'dist', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\nBDA Bodega de Amigos corriendo en http://localhost:${PORT}`);
  console.log(`Desde otras PCs en la red: http://<IP-de-esta-PC>:${PORT}\n`);
});
