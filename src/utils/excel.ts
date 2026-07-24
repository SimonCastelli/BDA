import * as XLSX from 'xlsx';
import { Wine } from '../types';
import { useCategoryStore } from '../store/categoryStore';

export interface ImportedWine {
  name: string;
  code: string;
  category: string;
  winery?: string;
  varietal?: string;
  region?: string;
  vintage?: number;
  stock: number;
  bottlesPerCase: number;
  prices: { bottle: number; case: number; market: number };
  notes?: string;
}

export interface ImportResult {
  valid: ImportedWine[];
  errors: string[];
}

export function downloadWineTemplate(): void {
  const { categories } = useCategoryStore.getState();

  const template = [
    {
      Nombre: 'Malbec Reserva',
      'Código de Barras': 'MAL-RES-21',
      Categoría: categories[0]?.label ?? 'Tinto',
      Bodega: 'Achaval Ferrer',
      Varietal: 'Malbec',
      Región: 'Mendoza',
      Cosecha: 2021,
      'Stock (botellas)': 24,
      'Botellas por Caja': 6,
      'Precio Botella': 3500,
      'Precio Caja': 18000,
      'Precio Mercado': 5200,
      Notas: '',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(template);
  ws['!cols'] = [
    { wch: 28 }, { wch: 18 }, { wch: 14 }, { wch: 20 },
    { wch: 16 }, { wch: 16 }, { wch: 10 }, { wch: 16 },
    { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 20 },
  ];

  const catData = categories.map((c) => ({ Categoría: c.label }));
  const wsCat = XLSX.utils.json_to_sheet(catData);
  wsCat['!cols'] = [{ wch: 20 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Vinos');
  XLSX.utils.book_append_sheet(wb, wsCat, 'Categorías válidas');
  XLSX.writeFile(wb, 'BDA_Plantilla_Vinos.xlsx');
}

export function importWinesFromExcel(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const { categories } = useCategoryStore.getState();
        const wb = XLSX.read(e.target!.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws);

        const valid: ImportedWine[] = [];
        const errors: string[] = [];

        rows.forEach((row, i) => {
          const rowNum = i + 2;
          const name = String(row['Nombre'] ?? '').trim();
          const code = String(row['Código de Barras'] ?? '').trim().toUpperCase();
          const catLabel = String(row['Categoría'] ?? '').trim().toLowerCase();

          if (!name) { errors.push(`Fila ${rowNum}: falta el Nombre`); return; }
          if (!code) { errors.push(`Fila ${rowNum}: falta el Código de Barras`); return; }

          const cat = categories.find((c) => c.label.toLowerCase() === catLabel);
          if (!cat) {
            errors.push(`Fila ${rowNum} (${name}): categoría "${row['Categoría']}" no reconocida`);
            return;
          }

          valid.push({
            name,
            code,
            category: cat.id,
            winery: String(row['Bodega'] ?? '').trim() || undefined,
            varietal: String(row['Varietal'] ?? '').trim() || undefined,
            region: String(row['Región'] ?? '').trim() || undefined,
            vintage: row['Cosecha'] ? Number(row['Cosecha']) : undefined,
            stock: Number(row['Stock (botellas)']) || 0,
            bottlesPerCase: Number(row['Botellas por Caja']) || 6,
            prices: {
              bottle: Number(row['Precio Botella']) || 0,
              case: Number(row['Precio Caja']) || 0,
              market: Number(row['Precio Mercado']) || 0,
            },
            notes: String(row['Notas'] ?? '').trim() || undefined,
          });
        });

        resolve({ valid, errors });
      } catch {
        reject(new Error('No se pudo leer el archivo Excel'));
      }
    };
    reader.readAsBinaryString(file);
  });
}
import { formatCurrency } from './format';

export function exportStockToExcel(wines: Wine[]): void {
  const getLabel = useCategoryStore.getState().getLabel;
  const data = wines.map((wine, index) => ({
    '#': index + 1,
    Código: wine.code,
    Nombre: wine.name,
    Categoría: getLabel(wine.category),
    Varietal: wine.varietal || '-',
    Región: wine.region || '-',
    Bodega: wine.winery || '-',
    Cosecha: wine.vintage || '-',
    'Stock (botellas)': wine.stock,
    'Botellas/Caja': wine.bottlesPerCase,
    'Stock (cajas)': Math.floor(wine.stock / wine.bottlesPerCase),
    'P. Botella': wine.prices.bottle,
    'P. Caja': wine.prices.case,
    'P. Mercado': wine.prices.market,
    'Valor Stock (bot.)': wine.prices.bottle * wine.stock,
  }));

  const ws = XLSX.utils.json_to_sheet(data);

  const colWidths = [
    { wch: 4 },  // #
    { wch: 12 }, // Código
    { wch: 30 }, // Nombre
    { wch: 12 }, // Categoría
    { wch: 16 }, // Varietal
    { wch: 16 }, // Región
    { wch: 20 }, // Bodega
    { wch: 10 }, // Cosecha
    { wch: 16 }, // Stock botellas
    { wch: 14 }, // Botellas/Caja
    { wch: 14 }, // Stock cajas
    { wch: 14 }, // P. Botella
    { wch: 12 }, // P. Caja
    { wch: 14 }, // P. Mercado
    { wch: 18 }, // Valor Stock
  ];
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inventario BDA');

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `BDA_Stock_${date}.xlsx`);
}

export function exportPricesToExcel(wines: Wine[]): void {
  const getLabel = useCategoryStore.getState().getLabel;
  const data = wines.map((wine, index) => ({
    '#': index + 1,
    Código: wine.code,
    Nombre: wine.name,
    Categoría: getLabel(wine.category),
    'Precio Botella': wine.prices.bottle,
    'Precio Caja': wine.prices.case,
    'Precio Mercado': wine.prices.market,
    'Dif. Botella vs Mercado': `${(((wine.prices.market - wine.prices.bottle) / wine.prices.market) * 100).toFixed(1)}%`,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 4 }, { wch: 12 }, { wch: 30 }, { wch: 12 },
    { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 24 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Precios BDA');

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `BDA_Precios_${date}.xlsx`);
}
