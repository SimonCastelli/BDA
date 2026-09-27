---
name: migracion-backend-express-v1-2
description: La app dejó de ser 100% cliente (localStorage) y pasó a tener backend Express propio con datos en filesystem
metadata:
  type: project
---

En la v1.2 el proyecto pasó de ser una app 100% cliente (React + Zustand persistido en `localStorage`, pensada para abrirse incluso sin servidor vía `file://dist/index.html`) a tener un **backend propio con Express** (`server.js` en la raíz del repo) que expone una API REST.

## Qué cambió

- Los datos (`wines`, `orders`, `contacts`, `categories`, `liquidaciones`, `receptions`) ahora se guardan como archivos JSON del lado del servidor, en la carpeta `data/` — no solo en el navegador del cliente.
- Se agregaron **categorías dinámicas**: antes eran un enum fijo (`tinto|blanco|rosado|espumante|dulce|otro`), ahora se pueden agregar/editar desde la app.
- Se agregó **importación desde Excel** para cargar stock masivamente.

**Why:** los datos ya no dependen del `localStorage` de un navegador puntual — persisten en el servidor y son compartibles entre dispositivos/usuarios que apunten al mismo backend. Esto habilita el esquema de backups automáticos del servidor (ver [[backups-automaticos-v1-3]]), que solo tiene sentido si los datos viven en el filesystem del servidor.

**How to apply:** cualquier cambio de datos pasa por `src/api/index.ts` → `server.js` → `data/*.json`. No asumir que el estado vive solo en Zustand/localStorage — eso es solo caché en memoria del cliente, la fuente de verdad es el servidor. Ver [[contexto-general-del-proyecto]] para la nota sobre que `CLAUDE.md` puede no reflejar este cambio de arquitectura.
