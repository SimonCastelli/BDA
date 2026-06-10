# BDA — Bodega de Amigos

Sistema de gestión de stock, precios y pedidos para la bodega.

## Funcionalidades

### 📦 Inventario (Stock)
- Listado completo de vinos con código, categoría, bodega, varietal, cosecha y stock.
- Búsqueda en tiempo real por nombre, código, bodega, varietal y región.
- Filtro por categoría (Tinto, Blanco, Rosado, Espumante, Dulce, Otro).
- Ordenamiento por columnas (nombre, categoría, stock, precio).
- Agregar/Editar/Eliminar vinos con formulario completo.
- Ajuste rápido de stock con botones +/− inline.
- Código QR generado automáticamente por vino (visualizable e imprimible).
- Alerta visual de stock crítico (≤ 6 botellas) con fondo destacado.
- **Exportar a Excel** con todos los datos del inventario.

### 💰 Precios
- Vista de los 3 precios por vino: **Botella**, **Caja**, **Mercado**.
- **Edición inline**: click en cualquier precio para editarlo directamente.
- Columna `% DESC.` que muestra el descuento vs. precio de mercado.
- Búsqueda y filtro por categoría.
- **Exportar a Excel** con tabla de precios.

### 🛒 Pedidos
- Historial de pedidos con búsqueda y filtro por estado.
- Estados: Borrador → Confirmado → Entregado (o Cancelado).
- Resumen estadístico: total de pedidos, ingresos, confirmados, entregados.

### 📝 Nuevo Pedido
- Búsqueda de vinos para agregar al pedido.
- Selección de cantidad, unidad (Botella/Caja) y tipo de precio (Botella/Caja/Mercado).
- Formulario de cliente: nombre, teléfono, email, dirección, CUIT.
- Descuento porcentual, forma de pago, fecha de entrega y notas.
- Cálculo de subtotal y total en tiempo real.

### 📄 Remito PDF
- Generación de remito PDF profesional desde el detalle del pedido.
- Incluye: datos del cliente, lista de productos, precios, totales y estado.
- Descarga automática con nombre `BDA_Remito_BDA-XXXX.pdf`.

---

## Instalación y uso

### Requisitos
- Node.js 18+
- npm 9+

### Pasos

```bash
# Clonar / entrar al directorio
cd ~/Proyectos/bda

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La app queda disponible en **http://localhost:5173**

### Build para producción

```bash
npm run build
npm run preview
```

---

## Tecnologías

| Herramienta | Uso |
|---|---|
| React 18 + TypeScript | Interfaz de usuario |
| Vite | Bundler y dev server |
| Tailwind CSS | Estilos |
| Zustand + localStorage | Estado persistente (datos guardados en el navegador) |
| React Router v6 | Navegación entre páginas |
| SheetJS (xlsx) | Exportación a Excel |
| jsPDF + jspdf-autotable | Generación de PDF |
| react-qr-code | Códigos QR |
| lucide-react | Íconos |
| date-fns | Formato de fechas en español |

---

## Estructura del proyecto

```
src/
├── types/          # Tipos TypeScript (Wine, Order, etc.)
├── store/          # Estado global (Zustand + localStorage)
│   ├── wineStore.ts
│   └── orderStore.ts
├── utils/          # Funciones utilitarias
│   ├── excel.ts    # Exportación Excel
│   ├── pdf.ts      # Generación PDF
│   └── format.ts   # Formato de moneda/fecha
├── components/
│   ├── ui/         # Componentes reutilizables (Modal, Badge, etc.)
│   └── Layout/     # Sidebar y estructura de layout
└── pages/          # Páginas principales
    ├── Dashboard.tsx
    ├── StockPage.tsx
    ├── PricesPage.tsx
    ├── OrdersPage.tsx
    ├── NewOrderPage.tsx
    └── OrderDetailPage.tsx
```

---

## Persistencia de datos

Los datos se guardan automáticamente en el **localStorage del navegador** bajo las claves:
- `bda-wines` — inventario de vinos
- `bda-orders` — historial de pedidos

Para hacer un backup, exportar el stock a Excel desde la página de Inventario.

---

## Notas

- La numeración de pedidos es automática y secuencial: `BDA-0001`, `BDA-0002`, etc.
- El stock crítico se define como ≤ 6 botellas.
- Los precios son en **pesos argentinos (ARS)**.
