---
name: backups-automaticos-v1-3
description: Cómo funcionan los backups diarios del servidor y el flujo para actualizar la app sin perder datos
metadata:
  type: project
---

## Backups automáticos

El servidor (`server.js`) crea un backup automático **cada día al iniciarse**, en la carpeta `backups/`:

```
bda/
└── backups/
    ├── bda-backup-2026-08-10.json
    ├── bda-backup-2026-08-11.json
    └── bda-backup-2026-08-12.json   ← más reciente
```

- Se conservan los últimos **7 días** (rotación automática).
- Si algo sale mal, se puede **restaurar** desde el Dashboard de la app (botón **Restaurar backup**) usando cualquiera de esos archivos.
- También se puede **exportar un backup manual** en cualquier momento desde el Dashboard (botón **Exportar backup**).

La carpeta `backups/` (igual que `data/`) es contenido generado en runtime, no código fuente — no se versiona ni se incluye en las actualizaciones.

## Flujo de actualización de versión

**En la PC de desarrollo (antes de enviar):**
1. Hacer los cambios necesarios en el código.
2. `npm run build` → genera `dist/`.
3. Pedirle a Claude "crea la actualización" → genera un `.zip` en `~/Downloads/` con solo los archivos modificados.

**En la PC principal (Windows, donde corre la app real):**
1. Antes de empezar: abrir la app y hacer clic en **Exportar backup** (Dashboard), guardar el `.json` en un lugar seguro.
2. Detener el servidor.
3. Copiar el `.zip` a la carpeta del proyecto (ej. `C:\bda\`) y extraerlo ahí, reemplazando los archivos que pida Windows.
4. **No tocar la carpeta `data/`** — si el `.zip` no la incluye, no hay riesgo de perder datos reales.
5. Reiniciar el servidor con `iniciar.bat`.
6. Abrir la app y verificar que todo funcione.

**Qué incluye el `.zip` de actualización:**

| Incluido | No incluido |
|---|---|
| `dist/` (app compilada) | `data/` (datos reales) |
| `server.js` | `backups/` |
| `package.json` | `node_modules/` |
| `src/` (código fuente) | `.env` |
| Archivos de configuración | |

**Why:** separar código de datos es lo que hace posible actualizar la app en la PC de producción sin arriesgar el stock/pedidos/contactos reales — solo tiene sentido desde que los datos viven en el filesystem del servidor ([[migracion-backend-express-v1-2]]).

**How to apply:** al generar una actualización para el usuario, nunca incluir `data/` ni `backups/` en el zip. Ver [[contexto-general-del-proyecto]] para el resto del contexto del proyecto.
