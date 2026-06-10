# BDA — Bodega de Amigos

Sistema web completo de gestión de bodega (stock, precios, pedidos, contactos, recepciones).
Directorio: `/home/simonc/Proyectos/bda/`

## Comandos

```bash
npm run dev      # dev server → http://localhost:5173
npm run build    # genera dist/ para abrir con file://
npx tsc --noEmit # type-check
```

**Abrir sin servidor:** `xdg-open ~/Proyectos/bda/dist/index.html`
El router es HashRouter — las rutas funcionan como `index.html#/stock`.

---

## Stack

| Librería | Uso |
|---|---|
| React 18 + TypeScript + Vite | UI y build |
| Tailwind CSS | Estilos (colores: `burgundy`, `gold`, `cream`) |
| Zustand + persist | Estado en localStorage |
| React Router v6 (HashRouter) | Navegación |
| SheetJS (xlsx) | Export Excel |
| jsPDF + jspdf-autotable | PDF remito y lista de precios |
| react-barcode | Visualización de códigos CODE128 |
| lucide-react | Íconos |
| date-fns | Fechas en español |

**LocalStorage keys:** `bda-wines` · `bda-orders` · `bda-contacts` · `bda-receptions`

---

## Rutas

| Ruta | Página |
|---|---|
| `/` | Dashboard |
| `/stock` | Inventario (CRUD + barcode + ajuste stock) |
| `/precios` | Precios por canal (edición inline + export Excel/PDF) |
| `/pedidos` | Lista de pedidos |
| `/pedidos/nuevo` | Crear pedido |
| `/pedidos/:id` | Detalle pedido (+ marcar entregado → descuenta stock) |
| `/contactos` | CRUD contactos con canal de precio por defecto |
| `/recepcion` | Recepción de mercadería + historial (tabs) |

---

## Arquitectura de archivos

```
src/
├── types/index.ts            → todos los tipos + labels
├── store/
│   ├── wineStore.ts          → CRUD vinos, updateStock (8 muestras al inicio)
│   ├── orderStore.ts         → CRUD pedidos, numeración BDA-0001…
│   ├── contactStore.ts       → CRUD contactos
│   └── receptionStore.ts     → historial de recepciones REC-0001…
├── utils/
│   ├── excel.ts              → exportStockToExcel, exportPricesToExcel
│   ├── pdf.ts                → generateRemitoPDF(order), generatePriceListPDF(wines, cat?)
│   └── format.ts             → formatCurrency(ARS), formatDate, generateId
├── components/
│   ├── ui/                   → Modal, ConfirmDialog, SearchBar, Badge, EmptyState
│   └── Layout/               → Sidebar, Layout (Outlet wrapper)
└── pages/
    ├── Dashboard.tsx         → 4 stats, barras de categoría, stock crítico, últimos pedidos
    ├── StockPage.tsx         → tabla sorteable, buscar+filtrar, CRUD, barcode modal, +/-
    ├── PricesPage.tsx        → edición inline por celda (Enter/blur guarda), PDF por cat.
    ├── OrdersPage.tsx        → lista con filtros de estado, stats de ingresos
    ├── NewOrderPage.tsx      → selector contacto + canal de precio global + vinos
    ├── OrderDetailPage.tsx   → detalle + confirm entrega (descuenta stock) + PDF
    ├── ContactsPage.tsx      → CRUD con canal defaultPriceType
    └── StockIntakePage.tsx   → scan/busca, detecta nuevos, tabs Nueva/Historial
```

---

## Tipos clave

```typescript
type WineCategory = 'tinto'|'blanco'|'rosado'|'espumante'|'dulce'|'otro'
type PriceType    = 'bottle'|'case'|'market'|'custom'
type OrderStatus  = 'draft'|'confirmed'|'delivered'|'cancelled'
type OrderUnit    = 'bottle'|'case'

// Canales de precio
PRICE_TYPE_LABELS = { bottle:'Por Botella', case:'Por Caja', market:'Mercado / Rest.', custom:'Personalizado' }
PRICE_TYPE_SHORT  = { bottle:'Botella Suelta', case:'Caja Entera', market:'Mercado/Rest.', custom:'Personalizado' }

interface Wine {
  id, name, code,            // code = código de barras CODE128
  category, vintage?, region?, winery?, varietal?,
  stock,                     // total botellas
  bottlesPerCase,
  prices: { bottle, case, market },  // ARS
  notes?, createdAt, updatedAt
}

interface Contact {
  id, name, company?, phone?, address?, email?, cuit?,
  defaultPriceType: 'bottle'|'case'|'market',
  notes?, createdAt, updatedAt
}

interface Order {
  id, orderNumber,           // BDA-0001
  client: Client,
  items: OrderItem[],
  subtotal, discount, total,
  status, paymentMethod?, notes?, createdAt, deliveryDate?
}

interface OrderItem {
  id, wineId, wineName, wineCode,
  quantity, unit: OrderUnit, priceType: PriceType,
  unitPrice, subtotal
}

interface StockReception {
  id, receptionNumber,       // REC-0001
  items: StockReceptionItem[],
  totalBottles, newWinesCount,
  notes?, createdAt
}
```

---

## Flujos principales

### Crear pedido
1. `/pedidos/nuevo` → seleccionar contacto (auto-fill cliente + canal)
2. Elegir **canal de precio global** (Botella Suelta / Caja Entera / Mercado/Rest.)
3. Buscar vinos → cada uno hereda el canal pero tiene selector propio para override
4. Guardar → navega a `/pedidos/:id`

### Marcar entregado (descuenta stock)
- En `/pedidos/:id`, botón "Marcar Entregado" abre modal de confirmación
- Muestra: por ítem → botellas a descontar y stock resultante
- Al confirmar: `updateStock(wineId, -bottles)` para cada ítem
  - unit=bottle → resta `quantity` botellas
  - unit=case → resta `quantity × wine.bottlesPerCase` botellas

### Recepción de mercadería
- Escanear/escribir código → Enter para match exacto o dropdown para buscar
- Código no encontrado → alerta ámbar → formulario rápido para registrar vino nuevo
- "Aplicar al Stock" → `updateStock(id, +quantity)` + guarda en historial
- Tab "Historial" → lista expandible de recepciones pasadas (REC-0001…)

### Lista de precios PDF
- Precios > "Lista PDF" → modal elige categoría o todas
- `generatePriceListPDF(wines, category?)` → agrupa por categoría si es "todas"

---

## Colores Tailwind custom

```js
burgundy: { DEFAULT:'#722F37', dark:'#4A1C23', light:'#9E4454' }
gold:     { DEFAULT:'#C4A35A', light:'#E8D5A3', dark:'#9A7A35' }
cream:    { DEFAULT:'#FAF6F0', dark:'#F0EAE0' }
```

Clases CSS propias (en `index.css`):
`.btn-primary` `.btn-secondary` `.btn-ghost` `.btn-danger`
`.input` `.label` `.card` `.table-header` `.table-cell`

---

## Stock crítico

Stock ≤ 6 botellas → fila roja en StockPage, badge rojo en Dashboard, tabla "Vinos con Stock Crítico".

---

## Posibles mejoras futuras

- Backup/restore de datos (export/import JSON de localStorage)
- Historial de cambios de precios
- Múltiples usuarios / autenticación
- Notificaciones de stock crítico
- Estadísticas de ventas por período
