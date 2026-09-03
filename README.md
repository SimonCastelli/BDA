# 🍷 BDA — Bodega de Amigos

Sistema web de gestión integral para una bodega/distribuidora de vinos: stock, precios por canal, pedidos, contactos, recepción de mercadería y liquidaciones — todo en una sola app, pensada para usarse desde varias PCs en la misma red.

## Índice

- [Funcionalidades](#funcionalidades)
- [Arquitectura](#arquitectura)
- [Instalación y uso](#instalación-y-uso)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Persistencia y backups](#persistencia-y-backups)
- [Notas de seguridad](#notas-de-seguridad)
- [Tecnologías](#tecnologías)

## Funcionalidades

### 📊 Dashboard
Vista general con estadísticas clave, ventas por categoría, stock crítico y últimos pedidos.

### 📦 Stock
- Listado completo de vinos: código de barras, categoría, bodega, varietal, cosecha y stock.
- Búsqueda en tiempo real y filtro por categoría.
- Alta / edición / baja de vinos, con ajuste rápido de stock (+/−).
- Código de barras CODE128 generado e imprimible por vino.
- Importación masiva desde Excel (con plantilla descargable).
- Alerta visual de **stock crítico** (≤ 6 botellas).
- Exportación a Excel.

### 💰 Precios
- Tres canales de precio por vino: **Botella suelta**, **Caja entera** y **Mercado/Restô**.
- Edición inline (click en cualquier celda, guarda con Enter o al perder foco).
- Lista de precios en **PDF**, filtrable por categoría y por bodega, con opción de excluir vinos sin stock.
- Exportación a Excel.

### 🛒 Pedidos
- Alta de pedido: selección de contacto (autocompleta cliente y canal), canal de precio global con override por ítem.
- Estados: Borrador → Confirmado → Entregado / Cancelado.
- Pedidos en Borrador/Confirmado son editables; al marcar **Entregado** se descuenta el stock automáticamente y el pedido queda bloqueado.
- Remito en PDF por pedido.

### 📇 Contactos
CRUD de clientes/comercios con canal de precio por defecto, CUIT, dirección y notas.

### 📥 Recepción de mercadería
Escaneo o búsqueda por código de barras para sumar stock; si el código no existe, alta rápida de vino nuevo. Historial de recepciones numeradas (`REC-0001…`).

### 🧾 Liquidaciones
Gestión de liquidaciones a clientes, con numeración propia (`LIQ-0001…`) y PDF.

### ⚙️ Configuración
Categorías de vino dinámicas (crear, renombrar, recolorear) y backup/restore de todos los datos desde la app.

## Arquitectura

La app es un cliente React (Vite) que habla por HTTP con un servidor Express propio — pensada para correr en una PC de la red local y ser usada desde el navegador de cualquier otra PC de esa misma red.

```
Navegador (React SPA) ── fetch /api/* ──► server.js (Express) ──► data/*.json
```

- El servidor carga los `data/*.json` en memoria al iniciar y los persiste en disco en cada escritura.
- El cliente hace *optimistic updates*: aplica el cambio en pantalla al instante y lo confirma contra el servidor en segundo plano; si falla, revierte.
- Router: React Router v6 en modo `HashRouter` (rutas del tipo `index.html#/stock`), lo que permite abrir el build también con `file://` si hiciera falta.

| Ruta | Página |
|---|---|
| `/` | Dashboard |
| `/stock` | Inventario |
| `/precios` | Precios por canal |
| `/pedidos` | Lista de pedidos |
| `/pedidos/nuevo` | Nuevo pedido |
| `/pedidos/:id` | Detalle de pedido |
| `/pedidos/:id/editar` | Editar pedido |
| `/contactos` | Contactos |
| `/recepcion` | Recepción de mercadería |
| `/liquidaciones` | Lista de liquidaciones |
| `/liquidaciones/nueva` | Nueva liquidación |
| `/liquidaciones/:id/editar` | Editar liquidación |
| `/configuracion` | Categorías y backup |

## Instalación y uso

### Requisitos
- Node.js 18+
- npm 9+

### Desarrollo

```bash
npm install
npm run dev
```

Abre **http://localhost:5173** — el dev server proxea `/api` hacia `http://localhost:3000`, así que para tener datos hace falta el backend corriendo en paralelo (ver abajo).

### Producción (server + build)

```bash
npm run build   # genera dist/
node server.js  # sirve dist/ y la API en http://localhost:3000
```

En Windows, `iniciar.bat` hace ambos pasos con doble click. Desde otra PC de la misma red: `http://<IP-de-esta-PC>:3000`.

### Type-check

```bash
npx tsc --noEmit
```

## Estructura del proyecto

```
src/
├── types/index.ts        → tipos compartidos (Wine, Order, Contact, Liquidacion, …)
├── api/                   → cliente fetch tipado hacia /api/*
├── store/                 → estado global (Zustand) con optimistic updates
│   ├── wineStore.ts
│   ├── orderStore.ts
│   ├── contactStore.ts
│   ├── receptionStore.ts
│   ├── liquidacionStore.ts
│   └── categoryStore.ts
├── utils/
│   ├── excel.ts           → exportación a Excel
│   ├── pdf.ts              → remitos, listas de precios, liquidaciones en PDF
│   └── format.ts           → moneda (ARS), fechas, ids
├── components/
│   ├── ui/                 → Modal, ConfirmDialog, SearchBar, Badge, EmptyState
│   └── Layout/              → Sidebar y layout general
└── pages/                  → una página por ruta (ver tabla de arriba)

server.js                  → API REST + servido estático de dist/
data/                       → JSON con los datos reales (no versionado)
backups/                    → backups diarios automáticos (no versionado)
```

## Persistencia y backups

Los datos viven en `data/*.json` en el servidor (no en el navegador) y **no forman parte del repositorio** — ver `.gitignore`. Cada PC/servidor que corre la app tiene sus propios datos reales en disco.

- El servidor genera un **backup automático diario** en `backups/` (se conservan los últimos 7).
- Desde **Configuración** también se puede exportar/restaurar un backup manual en cualquier momento.

## Notas de seguridad

La API (`server.js`) no tiene autenticación: está pensada para correr únicamente dentro de una red local de confianza. Si se despliega en un servidor accesible desde internet, hay que agregar autenticación (API key o login) antes de exponerla — de lo contrario cualquiera con la URL puede leer o modificar todos los datos.

## Tecnologías

| Herramienta | Uso |
|---|---|
| React 18 + TypeScript + Vite | UI y build |
| Express | API REST + servido estático |
| Tailwind CSS | Estilos |
| Zustand | Estado en cliente (optimistic updates) |
| React Router v6 (HashRouter) | Navegación |
| SheetJS (xlsx) | Import/export Excel |
| jsPDF + jspdf-autotable | Remitos, listas de precios y liquidaciones en PDF |
| react-barcode | Códigos de barras CODE128 |
| lucide-react | Íconos |
| date-fns | Fechas en español |

---

Ver [`ACTUALIZACIONES.md`](./ACTUALIZACIONES.md) para el historial de versiones y el flujo de actualización en producción.
