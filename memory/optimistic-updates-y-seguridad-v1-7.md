---
name: optimistic-updates-y-seguridad-v1-7
description: Los stores pasaron a optimistic update + caché en servidor, y se sacó data/backups del tracking de git tras exponerse datos de prueba en el repo público
metadata:
  type: project
---

Nota de backfill: esto pasó el 3 de septiembre (PR #1, rama `claude/project-file-security-...`), antes de que existiera la convención de memoria dual — se documenta acá ahora, al detectar el 27 de septiembre que esta carpeta local había quedado desincronizada de este fix.

## Optimistic updates

Los stores (`orderStore`, `liquidacionStore`, `receptionStore`, `contactStore`, `wineStore`) dejaron de hacer `await api.X.create(...)` antes de actualizar el estado local. Ahora:

1. Actualizan el estado de Zustand **inmediatamente** (optimista).
2. Disparan la llamada a la API en paralelo.
3. Si la llamada falla, **revierten solos** el estado local al valor anterior (`.catch(() => set(...))`).

Esto significa que `addOrder`/`updateOrder`/etc. **ya no rechazan la promesa** en caso de error de red — siempre resuelven, incluso si el guardado real en el servidor termina fallando en segundo plano.

**Why:** antes, cada acción (guardar un pedido, ajustar stock, editar un precio) esperaba la respuesta del servidor antes de reflejarse en pantalla — con latencia real se sentía lento. Optimistic update hace que la UI responda al instante.

**How to apply:** cualquier código nuevo que llame a estos stores y necesite saber si el guardado realmente tuvo éxito **no puede confiar en un try/catch** — hay que revisar si el registro sigue existiendo en el store después (`useXStore.getState().items.some(...)`). Esto mordió al feature de borradores con autosave ([[borradores-autosave-mobile-v1-8]]): si el `create` optimista fallaba en segundo plano y el store revertía (borraba) el registro, el código de autosave seguía intentando `update` sobre un id que ya no existía. Se corrigió chequeando existencia antes de decidir create vs. update.

El servidor (`server.js`) en paralelo pasó a cargar todo `data/*.json` en memoria al iniciar (`db` en memoria) en vez de leer el disco en cada request, y solo escribe a disco después de cada mutación — reduce la latencia de las respuestas.

## Datos reales fuera del repo

Antes de este commit, `data/*.json` (contactos, pedidos, liquidaciones, vinos) y un PDF de lista de precios a comercios estaban **trackeados en git** — y este repo tiene remoto público en GitHub. El commit `chore: sacar datos reales y lista de precios del repo` los sacó del tracking y los agregó a `.gitignore`. Se revisó el historial y solo había datos de prueba (nombres tipo "dfsg", "simon"/"simonexpress" de testing), nunca datos reales de clientes — así que no hizo falta reescribir el historial de git, alcanzó con destrackear hacia adelante.

**Why:** este es exactamente el tipo de descuido que puede terminar exponiendo datos de clientes reales en un repo público, o —peor— perdiéndolos: una copia local vieja que todavía tenga `data/` trackeado, al sincronizar con `git pull`, hace que git **borre `data/*.json` del disco** al aplicar el commit que los saca del tracking (`git rm --cached` en el commit remoto + checkout local = archivo físicamente eliminado si no tiene cambios locales sin commitear que lo protejan).

**How to apply:** nunca trackear `data/` ni `backups/` en git, en ningún commit futuro, bajo ninguna circunstancia — son datos reales de producción, no código. Si alguna vez una copia local de este repo aparece con `data/` trackeado (por estar desactualizada), sincronizarla con mucho cuidado: hacer una copia de `data/`/`backups/` fuera del repo ANTES de cualquier `git pull`/`merge`/`checkout`, porque el fast-forward puede borrar esos archivos del disco. Ver [[borradores-autosave-mobile-v1-8]] para el incidente real que confirmó este riesgo (detectado y resuelto sin pérdida de datos el 27 de septiembre).
