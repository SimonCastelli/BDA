import express from 'express';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

const DATA_DIR = join(__dirname, 'data');
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR);

function read(file) {
  const p = join(DATA_DIR, file);
  if (!existsSync(p)) return [];
  return JSON.parse(readFileSync(p, 'utf-8'));
}

function write(file, data) {
  writeFileSync(join(DATA_DIR, file), JSON.stringify(data, null, 2));
}

// Seed categories on first run
if (!existsSync(join(DATA_DIR, 'categories.json'))) {
  write('categories.json', [
    { id: 'tinto',     label: 'Tinto',      color: 'bg-red-100 text-red-800 border-red-200' },
    { id: 'blanco',    label: 'Blanco',     color: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
    { id: 'rosado',    label: 'Rosado',     color: 'bg-pink-100 text-pink-700 border-pink-200' },
    { id: 'espumante', label: 'Espumante',  color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { id: 'dulce',     label: 'Dulce',      color: 'bg-amber-100 text-amber-800 border-amber-200' },
    { id: 'otro',      label: 'Otro',       color: 'bg-gray-100 text-gray-700 border-gray-200' },
  ]);
}

// Seed wines on first run
if (!existsSync(join(DATA_DIR, 'wines.json'))) {
  write('wines.json', [
    { id: 'w1', code: 'MAL-RES-21', name: 'Malbec Reserva', category: 'tinto', vintage: 2021, region: 'Mendoza', winery: 'Achaval Ferrer', varietal: 'Malbec', stock: 48, bottlesPerCase: 6, prices: { bottle: 3500, case: 18000, market: 5200 }, notes: '', createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
    { id: 'w2', code: 'CHAR-VU-22', name: 'Chardonnay Gran Reserva', category: 'blanco', vintage: 2022, region: 'Valle de Uco', winery: 'Zuccardi', varietal: 'Chardonnay', stock: 24, bottlesPerCase: 6, prices: { bottle: 2800, case: 14400, market: 4100 }, notes: '', createdAt: '2024-01-16T10:00:00Z', updatedAt: '2024-01-16T10:00:00Z' },
    { id: 'w3', code: 'CAB-SJ-20', name: 'Cabernet Sauvignon', category: 'tinto', vintage: 2020, region: 'San Juan', winery: 'Callia', varietal: 'Cabernet Sauvignon', stock: 60, bottlesPerCase: 12, prices: { bottle: 2200, case: 22000, market: 3400 }, notes: '', createdAt: '2024-01-17T10:00:00Z', updatedAt: '2024-01-17T10:00:00Z' },
    { id: 'w4', code: 'TOR-SAL-23', name: 'Torrontés Clásico', category: 'blanco', vintage: 2023, region: 'Salta', winery: 'Michel Torino', varietal: 'Torrontés', stock: 36, bottlesPerCase: 6, prices: { bottle: 1800, case: 9000, market: 2600 }, notes: '', createdAt: '2024-01-18T10:00:00Z', updatedAt: '2024-01-18T10:00:00Z' },
    { id: 'w5', code: 'MER-LUJ-21', name: 'Merlot Luján', category: 'tinto', vintage: 2021, region: 'Luján de Cuyo', winery: 'Catena Zapata', varietal: 'Merlot', stock: 18, bottlesPerCase: 6, prices: { bottle: 4200, case: 21600, market: 6000 }, notes: '', createdAt: '2024-01-19T10:00:00Z', updatedAt: '2024-01-19T10:00:00Z' },
    { id: 'w6', code: 'PIN-PAT-22', name: 'Pinot Noir Patagonia', category: 'tinto', vintage: 2022, region: 'Patagonia', winery: 'Chacra', varietal: 'Pinot Noir', stock: 12, bottlesPerCase: 6, prices: { bottle: 5500, case: 28500, market: 8200 }, notes: '', createdAt: '2024-01-20T10:00:00Z', updatedAt: '2024-01-20T10:00:00Z' },
    { id: 'w7', code: 'BRUT-MZA-22', name: 'Brut Nature Extra', category: 'espumante', vintage: 2022, region: 'Mendoza', winery: 'Chandon', varietal: 'Chardonnay/Pinot Noir', stock: 30, bottlesPerCase: 6, prices: { bottle: 3200, case: 16800, market: 4800 }, notes: '', createdAt: '2024-01-21T10:00:00Z', updatedAt: '2024-01-21T10:00:00Z' },
    { id: 'w8', code: 'ROS-MZA-23', name: 'Rosado de Malbec', category: 'rosado', vintage: 2023, region: 'Mendoza', winery: 'Trapiche', varietal: 'Malbec', stock: 6, bottlesPerCase: 6, prices: { bottle: 1600, case: 8400, market: 2400 }, notes: 'Pocas unidades', createdAt: '2024-01-22T10:00:00Z', updatedAt: '2024-01-22T10:00:00Z' },
  ]);
}

// ── Wines ─────────────────────────────────────────────────────────────────────

app.get('/api/wines', (_req, res) => res.json(read('wines.json')));

app.post('/api/wines', (req, res) => {
  const list = read('wines.json');
  list.push(req.body);
  write('wines.json', list);
  res.json(req.body);
});

app.put('/api/wines/:id', (req, res) => {
  const list = read('wines.json').map((w) => (w.id === req.params.id ? req.body : w));
  write('wines.json', list);
  res.json(req.body);
});

app.delete('/api/wines/:id', (req, res) => {
  write('wines.json', read('wines.json').filter((w) => w.id !== req.params.id));
  res.json({ ok: true });
});

app.patch('/api/wines/:id/stock', (req, res) => {
  const { delta } = req.body;
  let updated;
  const list = read('wines.json').map((w) => {
    if (w.id !== req.params.id) return w;
    updated = { ...w, stock: Math.max(0, w.stock + delta), updatedAt: new Date().toISOString() };
    return updated;
  });
  write('wines.json', list);
  res.json(updated);
});

app.patch('/api/wines/:id/prices', (req, res) => {
  const { prices } = req.body;
  let updated;
  const list = read('wines.json').map((w) => {
    if (w.id !== req.params.id) return w;
    updated = { ...w, prices, updatedAt: new Date().toISOString() };
    return updated;
  });
  write('wines.json', list);
  res.json(updated);
});

// ── Orders ────────────────────────────────────────────────────────────────────

app.get('/api/orders', (_req, res) => res.json(read('orders.json')));

app.post('/api/orders', (req, res) => {
  const list = read('orders.json');
  list.unshift(req.body);
  write('orders.json', list);
  res.json(req.body);
});

app.put('/api/orders/:id', (req, res) => {
  const list = read('orders.json').map((o) => (o.id === req.params.id ? req.body : o));
  write('orders.json', list);
  res.json(req.body);
});

app.patch('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  let updated;
  const list = read('orders.json').map((o) => {
    if (o.id !== req.params.id) return o;
    updated = { ...o, status };
    return updated;
  });
  write('orders.json', list);
  res.json(updated);
});

app.delete('/api/orders/:id', (req, res) => {
  write('orders.json', read('orders.json').filter((o) => o.id !== req.params.id));
  res.json({ ok: true });
});

// ── Contacts ──────────────────────────────────────────────────────────────────

app.get('/api/contacts', (_req, res) => res.json(read('contacts.json')));

app.post('/api/contacts', (req, res) => {
  const list = read('contacts.json');
  list.push(req.body);
  write('contacts.json', list);
  res.json(req.body);
});

app.put('/api/contacts/:id', (req, res) => {
  const list = read('contacts.json').map((c) => (c.id === req.params.id ? req.body : c));
  write('contacts.json', list);
  res.json(req.body);
});

app.delete('/api/contacts/:id', (req, res) => {
  write('contacts.json', read('contacts.json').filter((c) => c.id !== req.params.id));
  res.json({ ok: true });
});

// ── Categories ────────────────────────────────────────────────────────────────

app.get('/api/categories', (_req, res) => res.json(read('categories.json')));

app.post('/api/categories', (req, res) => {
  const list = read('categories.json');
  list.push(req.body);
  write('categories.json', list);
  res.json(req.body);
});

app.put('/api/categories/:id', (req, res) => {
  const list = read('categories.json').map((c) => (c.id === req.params.id ? req.body : c));
  write('categories.json', list);
  res.json(req.body);
});

app.delete('/api/categories/:id', (req, res) => {
  write('categories.json', read('categories.json').filter((c) => c.id !== req.params.id));
  res.json({ ok: true });
});

// ── Receptions ────────────────────────────────────────────────────────────────

app.get('/api/receptions', (_req, res) => res.json(read('receptions.json')));

app.post('/api/receptions', (req, res) => {
  const list = read('receptions.json');
  list.unshift(req.body);
  write('receptions.json', list);
  res.json(req.body);
});

app.delete('/api/receptions/:id', (req, res) => {
  write('receptions.json', read('receptions.json').filter((r) => r.id !== req.params.id));
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
