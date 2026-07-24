import { create } from 'zustand';
import { Wine, WinePrices } from '../types';
import { generateId } from '../utils/format';
import { api } from '../api';

interface WineStore {
  wines: Wine[];
  isLoading: boolean;
  init: () => Promise<void>;
  addWine: (wine: Omit<Wine, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Wine>;
  updateWine: (id: string, updates: Partial<Omit<Wine, 'id' | 'createdAt'>>) => Promise<void>;
  deleteWine: (id: string) => Promise<void>;
  updatePrices: (id: string, prices: WinePrices) => Promise<void>;
  updateStock: (id: string, delta: number) => Promise<void>;
}

export const useWineStore = create<WineStore>()((set, get) => ({
  wines: [],
  isLoading: false,

  init: async () => {
    set({ isLoading: true });
    const wines = await api.wines.getAll();
    set({ wines, isLoading: false });
  },

  addWine: async (wineData) => {
    const wine: Wine = {
      ...wineData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await api.wines.create(wine);
    set((s) => ({ wines: [...s.wines, wine] }));
    return wine;
  },

  updateWine: async (id, updates) => {
    const wine = get().wines.find((w) => w.id === id);
    if (!wine) return;
    const updated = { ...wine, ...updates, updatedAt: new Date().toISOString() };
    await api.wines.update(id, updated);
    set((s) => ({ wines: s.wines.map((w) => (w.id === id ? updated : w)) }));
  },

  deleteWine: async (id) => {
    await api.wines.remove(id);
    set((s) => ({ wines: s.wines.filter((w) => w.id !== id) }));
  },

  updatePrices: async (id, prices) => {
    const updated = await api.wines.patchPrices(id, prices);
    set((s) => ({ wines: s.wines.map((w) => (w.id === id ? updated : w)) }));
  },

  updateStock: async (id, delta) => {
    const updated = await api.wines.patchStock(id, delta);
    set((s) => ({ wines: s.wines.map((w) => (w.id === id ? updated : w)) }));
  },
}));
