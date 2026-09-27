---
name: contexto-general-del-proyecto
description: Qué es BDA, stack real actual y por qué el CLAUDE.md del repo queda desactualizado con cada versión nueva
metadata:
  type: project
---

**BDA (Bodega de Amigos)** es un sistema web de gestión integral de una bodega: stock, precios por canal, pedidos, contactos y recepción de mercadería.

## Stack actual (real, verificado en código)

- **Frontend:** React 18 + TypeScript + Vite, Tailwind CSS (colores custom `burgundy`/`gold`/`cream`), Zustand para estado en cliente, React Router v6 (HashRouter), SheetJS (Excel), jsPDF + autotable (PDFs), react-barcode, lucide-react, date-fns.
- **Backend:** servidor **Express** (`server.js`, raíz del repo) con API REST propia. Los datos (`wines`, `orders`, `contacts`, `categories`, `liquidaciones`, `receptions`) se persisten como archivos JSON en la carpeta `data/` del servidor, no solo en localStorage del navegador.
- **Backups:** el servidor crea un backup diario automático de todos los datos en `backups/bda-backup-<fecha>.json`, rotando y conservando los últimos 7 días.

**Why:** el `CLAUDE.md` del repo (instrucciones del proyecto) tiende a describir una versión anterior de la arquitectura — sigue mencionando cosas como "abrir sin servidor" vía `file://dist/index.html` o "estado 100% en localStorage" mucho después de que eso dejó de ser cierto (desde [[migracion-backend-express-v1-2]] el proyecto corre con un backend Express real). Documentar acá el estado real, verificado directamente en el código, evita arrastrar esa desactualización de sesión en sesión.

**How to apply:** antes de asumir cómo funciona algo por lo que dice `CLAUDE.md`, contrastarlo con el código (`server.js`, `src/api/index.ts`, `src/store/*`) — y si hay una discrepancia grande, vale la pena actualizar `CLAUDE.md` en algún momento, aunque no bloquea el trabajo del día a día.

## Rutas principales

| Ruta | Página |
|---|---|
| `/` | Dashboard |
| `/stock` | Inventario (CRUD + código de barras + ajuste de stock) |
| `/precios` | Precios por canal (edición inline + export Excel/PDF) |
| `/pedidos` | Lista de pedidos |
| `/pedidos/nuevo` | Crear pedido |
| `/pedidos/:id` | Detalle de pedido (marcar entregado → descuenta stock; editar si no está entregado) |
| `/contactos` | CRUD contactos con canal de precio por defecto |
| `/recepcion` | Recepción de mercadería + historial |
| `/liquidaciones` | Liquidaciones (agregada en v1.1) |
| `/configuracion` | Configuración |

## Historial de versiones (resumen)

| Versión | Qué trajo |
|---|---|
| v1.0 | Versión inicial: stock, pedidos, contactos, recepciones, export Excel/PDF |
| v1.1 | Liquidaciones, lista de precios por canal con decimales, assets y datos iniciales mejorados |
| v1.2 | Backend Express + API REST, categorías dinámicas, importación desde Excel — ver [[migracion-backend-express-v1-2]] |
| v1.3 | Backup automático diario + restauración manual desde Dashboard — ver [[backups-automaticos-v1-3]] |
| v1.4 | Fix de importación de Excel (formatos de columnas) — ver [[fix-importacion-excel-v1-4]] |
| v1.5 | Pedidos editables (Borrador/Confirmado) — ver [[pedidos-editables-v1-5]] |
| v1.6 | PDFs con encabezados en color bordo; lista de precios con filtro por bodega y opción de excluir vinos sin stock |
| v1.7 | Optimistic updates en los stores + caché en memoria del servidor (la app responde al instante); se saca `data/`/`backups/` del tracking de git — ver [[optimistic-updates-y-seguridad-v1-7]] |
| v1.8 | Sidebar colapsable con menú mobile off-canvas, layout de pedido/liquidación reordenado, botella/caja en Recepción, borradores con autosave — ver [[borradores-autosave-mobile-v1-8]] |

## Flujo de actualización de la app

El proyecto se distribuye en dos partes separadas:
- **Código** (`dist/`, `server.js`, `src/`, etc.) → se reemplaza en cada actualización.
- **Datos** (carpeta `data/`) → **nunca se toca** en una actualización, ahí vive el stock/pedidos/contactos reales.

Ver [[backups-automaticos-v1-3]] para el detalle completo del flujo de actualización y backups.
