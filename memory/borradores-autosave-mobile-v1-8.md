---
name: borradores-autosave-mobile-v1-8
description: Sidebar colapsable/mobile, layout de pedido-liquidación reordenado, botella/caja en Recepción, y borradores con autosave+recuperación
metadata:
  type: project
---

Cuatro cambios de UX/robustez sobre pedidos, liquidaciones y recepción, más el arranque de esta misma convención de memoria dual (vault + `memory/` del repo).

## 1. Layout: Productos arriba del contacto

En `NewOrderPage`, `EditOrderPage`, `NewLiquidacionPage`, `EditLiquidacionPage` — la columna derecha ahora muestra primero la lista de productos agregados ("Productos") y después los datos del cliente/contacto (antes era al revés). Solo se invirtió el orden de los dos `<div className="card">`, sin tocar lógica.

## 2. Sidebar colapsable + menú mobile

Nuevo `src/store/uiStore.ts` (zustand + `persist`, key `bda-ui`): `sidebarCollapsed` (persistido) y `mobileMenuOpen` (no persistido).

- **Desktop:** botón toggle en el sidebar lo colapsa a una franja de íconos (`w-[72px]`).
- **Mobile** (por debajo de `md:`): el sidebar es off-canvas — arranca oculto, un botón hamburguesa en la barra superior (agregada en `Layout.tsx`) lo despliega como panel superpuesto con overlay de fondo.

**Why:** la app no tenía ningún tratamiento para pantallas chicas — el sidebar fijo de 240px competía por espacio en el celular. Este es el punto de partida del rediseño mobile.

## 3. Botella/Caja en Recepción

`StockIntakePage` (Recepción) no tenía selector de unidad — todo se cargaba en botellas sueltas, a diferencia de Pedidos/Liquidaciones que ya soportaban botella/caja desde antes. Se agregó el mismo selector por fila, con un helper `bottleEquivalent()` que multiplica por `wine.bottlesPerCase` cuando la unidad es caja, usado para el descuento/alta de stock y para el total de botellas de la recepción.

`StockReceptionItem` ganó un campo `unit?: OrderUnit` (opcional, retrocompatible — las recepciones viejas sin el campo se tratan como `'bottle'`). `receptionStore.addReception` cambió de firma: ahora recibe `totalBottles` ya calculado por el caller, en vez de sumarlo internamente (esa suma interna quedaba mal si había ítems por caja).

## 4. Borradores con autosave y recuperación

**Why:** cargar un pedido/liquidación grande y perder todo por un corte de conexión o un cierre accidental del navegador era un riesgo real sin ningún mecanismo de recuperación.

Nuevo hook genérico `src/hooks/useDraftAutosave.ts` + componente `src/components/ui/DraftBanner.tsx`, usados en las 4 páginas de creación/edición:

- Cada cambio del formulario se guarda (debounced) en `localStorage`, **sin depender de la conexión** — así se recupera el trabajo si se corta la conexión o se cierra el navegador a mitad de carga. Al reabrir la página, si hay algo guardado, aparece un banner "Continuar / Descartar".
- En paralelo, en las páginas de creación (`NewOrderPage`, `NewLiquidacionPage`) ese mismo autosave crea/actualiza un **pedido o liquidación real en el backend con `status: 'draft'`** — por eso el borrador ya aparece en la sección de Pedidos/Liquidaciones (filtro "Borrador") incluso antes de guardarlo manualmente. Esto requirió agregar `status?: 'draft' | 'confirmed'` a `Liquidacion` (no tenía ningún campo de estado hasta ahora) y un filtro de estado nuevo en `LiquidacionesPage` (antes solo existía en `OrdersPage`).
- En las páginas de edición (`EditOrderPage`, `EditLiquidacionPage`) el autosave llama directo a `updateOrder`/`updateLiquidacion` sobre el registro ya existente.
- "Cancelar" solo limpia la caché local — el borrador ya sincronizado al backend (si lo hay) queda intacto y visible en Borradores; no se borra.

**How to apply:** cualquier formulario de creación/edición nuevo que valga la pena proteger contra pérdida de datos puede reusar `useDraftAutosave` con el mismo patrón (storageKey único, `isMeaningful` para no persistir formularios vacíos, `onPersisted` para el sync a backend).

Nota de reconciliación: esta feature se armó sobre una copia local desactualizada (ver punto 6) que todavía no tenía el optimistic update de [[optimistic-updates-y-seguridad-v1-7]]. Al sincronizar, hubo que corregir `onPersisted`/`handleSave` en `NewOrderPage`/`NewLiquidacionPage`: como los stores ahora revierten solos el registro si falla el guardado en el servidor (en vez de rechazar la promesa), el código ya no puede confiar en un try/catch para decidir "reintentar" — ahora chequea `useOrderStore.getState().orders.some(o => o.id === draftId)` (ídem liquidaciones) antes de decidir si hace `update` o vuelve a `create`.

## 5. Memoria dual: vault + `memory/` del repo

A partir de esta actualización, cada cambio grande del proyecto se registra **tanto en el vault de Obsidian** (ya era la regla) **como en la carpeta `memory/` de este mismo repo** — mismo contenido, dos lugares. Ver la sección nueva en `CLAUDE.md` del repo para el detalle de la convención.

## 6. Sincronización de una copia local desactualizada (incidente sin pérdida de datos)

Al arrancar esta sesión, esta carpeta local (`/home/simon/Projects/bda`) estaba 4 commits atrás de `origin/main` — nunca se había sincronizado con [[optimistic-updates-y-seguridad-v1-7]]. Seguía con `data/*.json` trackeado en git de una época anterior a ese fix.

Al hacer `git merge --ff-only origin/main` para ponerla al día, **git borró la carpeta `data/` entera del disco** — el mecanismo real detrás de "se pierden datos reales al actualizar" que el usuario sospechaba. Se evitó la pérdida haciendo una copia de `data/`/`backups/` fuera del repo (`/tmp`) antes de tocar git, y restaurándola después del merge (ahora sí gitignorada correctamente). Cero pérdida de datos, pedido de prueba incluido.

**Why:** confirma en la práctica el riesgo que ya advertía [[optimistic-updates-y-seguridad-v1-7]] — no es teórico, pasó acá mismo.

**How to apply:** antes de cualquier `git pull`/`merge`/`checkout`/`reset` en una copia de este repo que pueda estar desactualizada, copiar `data/` y `backups/` fuera del repo primero. Si alguna vez se detecta que una copia (sobre todo la de producción) tiene `data/` trackeado en git, tratarlo como una emergencia — sincronizarla puede borrar los datos reales de la bodega.

Ver [[contexto-general-del-proyecto]] para el resto del historial de versiones.
