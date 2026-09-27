---
name: fix-importacion-excel-v1-4
description: La importación de Excel en Stock ahora acepta tanto el formato de la plantilla como el generado por la propia exportación
metadata:
  type: project
---

## Problema

La importación de Excel en `/stock` solo reconocía el formato de la **plantilla** de importación. Si un usuario exportaba el stock a Excel desde la propia página de Stock (`exportStockToExcel`) y después intentaba reimportar ese mismo archivo, no lo reconocía correctamente — los nombres de columna no coincidían.

## Fix

Se aceptan ahora ambos formatos de columnas (el de la plantilla de importación y el generado por la exportación desde Stock):

| Plantilla | Exportado desde Stock |
|---|---|
| `Código de Barras` | `Código` |
| `Precio Botella` | `P. Botella` |
| `Precio Caja` | `P. Caja` |
| `Precio Mercado` | `P. Mercado` |
| `Botellas por Caja` | `Botellas/Caja` |

**Why:** un usuario exportando su propio stock y reimportándolo (para editar en Excel y volver a subir) es un flujo esperable, no un caso raro — el fix evita que se rompa silenciosamente por un simple cambio de nombre de columna.

**How to apply:** al tocar `src/utils/excel.ts` o la lógica de importación en `StockPage.tsx`, tener en cuenta que existen dos formatos de columnas válidos de entrada, no solo el de la plantilla. Relacionado con [[migracion-backend-express-v1-2]], que fue donde se agregó la importación desde Excel originalmente.
