import * as XLSX from 'xlsx';
import { Wine, CATEGORY_LABELS } from '../types';
import { formatCurrency } from './format';

export function exportStockToExcel(wines: Wine[]): void {
  const data = wines.map((wine, index) => ({
    '#': index + 1,
    Código: wine.code,
    Nombre: wine.name,
    Categoría: CATEGORY_LABELS[wine.category],
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
  const data = wines.map((wine, index) => ({
    '#': index + 1,
    Código: wine.code,
    Nombre: wine.name,
    Categoría: CATEGORY_LABELS[wine.category],
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
