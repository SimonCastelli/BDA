# Guía de Actualizaciones — BDA Bodega de Amigos

## Cómo funciona

El proyecto tiene dos partes:
- **Código** (`dist/`, `server.js`, `src/`, etc.) → se actualiza con cada nueva versión
- **Datos** (carpeta `data/`) → **NUNCA se toca en una actualización**, contiene el stock, pedidos, contactos, etc.

Cada actualización es un `.zip` con solo los archivos modificados. Al extraerlo en la PC principal se reemplazan los archivos de código, pero la carpeta `data/` queda intacta.

---

## Backups automáticos

El servidor crea un backup automático **cada día al iniciarse** en la carpeta `backups/`:

```
bda/
└── backups/
    ├── bda-backup-2026-08-10.json
    ├── bda-backup-2026-08-11.json
    └── bda-backup-2026-08-12.json   ← más reciente
```

Se guardan los últimos **7 días**. Si algo sale mal, podés restaurar desde el Dashboard de la app (botón **Restaurar backup**) usando cualquiera de estos archivos.

También podés exportar un backup manual desde el Dashboard en cualquier momento con el botón **Exportar backup**.

---

## Pasos para actualizar

### En la PC de desarrollo (antes de enviar)

1. Hacer los cambios necesarios en el código
2. Ejecutar `npm run build` para generar la carpeta `dist/`
3. Decirle a Claude **"crea la actualización"** → genera un `.zip` en `~/Downloads/` con solo los archivos modificados

### En la PC principal (Windows)

1. **Antes de empezar**: Abrí la app y hacé clic en **Exportar backup** (Dashboard) — guardá el `.json` en un lugar seguro
2. Detener el servidor (cerrar la ventana del servidor o el proceso)
3. Copiar el `.zip` a la carpeta del proyecto (ej: `C:\bda\` o donde esté instalado)
4. Extraer el `.zip` ahí mismo y **reemplazar todos los archivos cuando Windows lo pida**
5. **No tocar la carpeta `data/`** — si el `.zip` no la incluye, no hay riesgo
6. Volver a iniciar el servidor con `iniciar.bat`
7. Abrir la app y verificar que todo funcione

---

## Qué incluye el .zip de actualización

| Incluido | No incluido |
|---|---|
| `dist/` (app compilada) | `data/` (tus datos reales) |
| `server.js` | `backups/` |
| `package.json` | `node_modules/` |
| `src/` (código fuente) | `.env` |
| Archivos de configuración | |

---

## Historial de versiones

### v1.0 — Versión inicial
- Stock, pedidos, contactos, recepciones
- Exportación Excel y PDF

### v1.1 — Liquidaciones y mejoras de precios
- Página de liquidaciones
- Lista de precios por canal con decimales
- Assets y datos iniciales mejorados

### v1.2 — Backend Express y categorías dinámicas
- Servidor Express con API REST
- Categorías dinámicas (se pueden agregar/editar)
- Importación desde Excel

### v1.3 — Backup automático y restauración
- Backup automático diario en carpeta `backups/` (últimos 7 días)
- Botones Exportar/Restaurar backup en el Dashboard
- Esta guía de actualizaciones

### v1.4 — Corrección importación de stock
- Importar Excel ahora reconoce correctamente los archivos exportados desde la misma página de Stock
- Se aceptan ambos formatos de columnas: el de la plantilla y el del Excel exportado
  - `Código de Barras` y `Código` → ambos válidos
  - `Precio Botella` y `P. Botella` → ambos válidos
  - `Precio Caja` y `P. Caja` → ambos válidos
  - `Precio Mercado` y `P. Mercado` → ambos válidos
  - `Botellas por Caja` y `Botellas/Caja` → ambos válidos

### v1.5 — Pedidos editables
- Los pedidos en estado Borrador o Confirmado ahora tienen un botón **Editar** en el detalle
- Se puede editar todo: cliente, canal de precio, productos (agregar, quitar, cambiar cantidad), descuento, notas, forma de pago, fecha de entrega y estado
- Los pedidos entregados no son editables (el stock ya fue descontado)
- El stock se sigue descontando únicamente al marcar como entregado, igual que antes

### v1.6 — Mejoras en PDFs y lista de precios
- Encabezados de todos los PDFs (remitos, lista de precios, liquidaciones) ahora en color bordo
- Lista de precios PDF: nuevo filtro por bodega (además del filtro por categoría)
- Lista de precios PDF: opción para incluir o excluir vinos sin stock al generar el PDF
