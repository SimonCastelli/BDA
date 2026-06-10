import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Wine, WinePrices } from '../types';
import { generateId } from '../utils/format';

const SAMPLE_WINES: Wine[] = [
  {
    id: 'w1', code: 'MAL-RES-21', name: 'Malbec Reserva', category: 'tinto',
    vintage: 2021, region: 'Mendoza', winery: 'Achaval Ferrer', varietal: 'Malbec',
    stock: 48, bottlesPerCase: 6,
    prices: { bottle: 3500, case: 18000, market: 5200 },
    notes: '', createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'w2', code: 'CHAR-VU-22', name: 'Chardonnay Gran Reserva', category: 'blanco',
    vintage: 2022, region: 'Valle de Uco', winery: 'Zuccardi', varietal: 'Chardonnay',
    stock: 24, bottlesPerCase: 6,
    prices: { bottle: 2800, case: 14400, market: 4100 },
    notes: '', createdAt: '2024-01-16T10:00:00Z', updatedAt: '2024-01-16T10:00:00Z',
  },
  {
    id: 'w3', code: 'CAB-SJ-20', name: 'Cabernet Sauvignon', category: 'tinto',
    vintage: 2020, region: 'San Juan', winery: 'Callia', varietal: 'Cabernet Sauvignon',
    stock: 60, bottlesPerCase: 12,
    prices: { bottle: 2200, case: 22000, market: 3400 },
    notes: '', createdAt: '2024-01-17T10:00:00Z', updatedAt: '2024-01-17T10:00:00Z',
  },
  {
    id: 'w4', code: 'TOR-SAL-23', name: 'Torrontés Clásico', category: 'blanco',
    vintage: 2023, region: 'Salta', winery: 'Michel Torino', varietal: 'Torrontés',
    stock: 36, bottlesPerCase: 6,
    prices: { bottle: 1800, case: 9000, market: 2600 },
    notes: '', createdAt: '2024-01-18T10:00:00Z', updatedAt: '2024-01-18T10:00:00Z',
  },
  {
    id: 'w5', code: 'MER-LUJ-21', name: 'Merlot Luján', category: 'tinto',
    vintage: 2021, region: 'Luján de Cuyo', winery: 'Catena Zapata', varietal: 'Merlot',
    stock: 18, bottlesPerCase: 6,
    prices: { bottle: 4200, case: 21600, market: 6000 },
    notes: '', createdAt: '2024-01-19T10:00:00Z', updatedAt: '2024-01-19T10:00:00Z',
  },
  {
    id: 'w6', code: 'PIN-PAT-22', name: 'Pinot Noir Patagonia', category: 'tinto',
    vintage: 2022, region: 'Patagonia', winery: 'Chacra', varietal: 'Pinot Noir',
    stock: 12, bottlesPerCase: 6,
    prices: { bottle: 5500, case: 28500, market: 8200 },
    notes: '', createdAt: '2024-01-20T10:00:00Z', updatedAt: '2024-01-20T10:00:00Z',
  },
  {
    id: 'w7', code: 'BRUT-MZA-22', name: 'Brut Nature Extra', category: 'espumante',
    vintage: 2022, region: 'Mendoza', winery: 'Chandon', varietal: 'Chardonnay/Pinot Noir',
    stock: 30, bottlesPerCase: 6,
    prices: { bottle: 3200, case: 16800, market: 4800 },
    notes: '', createdAt: '2024-01-21T10:00:00Z', updatedAt: '2024-01-21T10:00:00Z',
  },
  {
    id: 'w8', code: 'ROS-MZA-23', name: 'Rosado de Malbec', category: 'rosado',
    vintage: 2023, region: 'Mendoza', winery: 'Trapiche', varietal: 'Malbec',
    stock: 6, bottlesPerCase: 6,
    prices: { bottle: 1600, case: 8400, market: 2400 },
    notes: 'Pocas unidades', createdAt: '2024-01-22T10:00:00Z', updatedAt: '2024-01-22T10:00:00Z',
  },
];

interface WineStore {
  wines: Wine[];
  addWine: (wine: Omit<Wine, 'id' | 'createdAt' | 'updatedAt'>) => Wine;
  updateWine: (id: string, updates: Partial<Omit<Wine, 'id' | 'createdAt'>>) => void;
  deleteWine: (id: string) => void;
  updatePrices: (id: string, prices: WinePrices) => void;
  updateStock: (id: string, delta: number) => void;
}

export const useWineStore = create<WineStore>()(
  persist(
    (set) => ({
      wines: SAMPLE_WINES,

      addWine: (wineData) => {
        const wine: Wine = {
          ...wineData,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ wines: [...s.wines, wine] }));
        return wine;
      },

      updateWine: (id, updates) => {
        set((s) => ({
          wines: s.wines.map((w) =>
            w.id === id ? { ...w, ...updates, updatedAt: new Date().toISOString() } : w
          ),
        }));
      },

      deleteWine: (id) => {
        set((s) => ({ wines: s.wines.filter((w) => w.id !== id) }));
      },

      updatePrices: (id, prices) => {
        set((s) => ({
          wines: s.wines.map((w) =>
            w.id === id ? { ...w, prices, updatedAt: new Date().toISOString() } : w
          ),
        }));
      },

      updateStock: (id, delta) => {
        set((s) => ({
          wines: s.wines.map((w) =>
            w.id === id
              ? { ...w, stock: Math.max(0, w.stock + delta), updatedAt: new Date().toISOString() }
              : w
          ),
        }));
      },
    }),
    { name: 'bda-wines' }
  )
);
