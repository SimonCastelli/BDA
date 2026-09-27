---
name: pedidos-editables-v1-5
description: Los pedidos en Borrador o Confirmado se pueden editar por completo; los entregados no, porque ya descontaron stock
metadata:
  type: project
---

Antes, un pedido no se podía modificar una vez creado. Desde la v1.5, los pedidos en estado **Borrador** o **Confirmado** tienen un botón **Editar** en `/pedidos/:id` (detalle del pedido).

Se puede editar todo:
- Cliente
- Canal de precio (Botella Suelta / Caja Entera / Mercado-Rest.)
- Productos: agregar, quitar, cambiar cantidad
- Descuento
- Notas
- Forma de pago
- Fecha de entrega
- Estado

## Regla de negocio que se mantiene

- Los pedidos **entregados no son editables** — una vez que se marca como entregado, el stock ya fue descontado, así que editar retroactivamente rompería la consistencia del stock.
- El stock se sigue descontando **únicamente** al marcar el pedido como entregado (igual que antes de esta versión): `unit=bottle` resta `quantity` botellas, `unit=case` resta `quantity × bottlesPerCase`.

**Why:** permitir editar pedidos ya entregados requeriría reconciliar el stock retroactivamente (revertir el descuento anterior y aplicar el nuevo), lo cual agrega una clase de bugs que no vale la pena para el beneficio — por eso la regla de "entregado = congelado" se mantiene incluso con pedidos editables.

**How to apply:** cualquier UI o lógica nueva sobre pedidos debe replicar este guard (`order.status === 'delivered'` → no editable) — ver `EditOrderPage.tsx`. Ver [[contexto-general-del-proyecto]] para el resto del flujo de pedidos, y [[borradores-autosave-mobile-v1-8]] para el guardado automático agregado sobre este mismo flujo de edición.
