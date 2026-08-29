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
    set((s) => ({ wines: [...s.wines, wine] }));
    api.wines.create(wine).catch(() => {
      set((s) => ({ wines: s.wines.filter((w) => w.id !== wine.id) }));
    });
    return wine;
  },

  updateWine: async (id, updates) => {
    const prev = get().wines.find((w) => w.id === id);
    if (!prev) return;
    const updated = { ...prev, ...updates, updatedAt: new Date().toISOString() };
    set((s) => ({ wines: s.wines.map((w) => (w.id === id ? updated : w)) }));
    api.wines.update(id, updated).catch(() => {
      set((s) => ({ wines: s.wines.map((w) => (w.id === id ? prev : w)) }));
    });
  },

  deleteWine: async (id) => {
    const prev = get().wines.find((w) => w.id === id);
    set((s) => ({ wines: s.wines.filter((w) => w.id !== id) }));
    api.wines.remove(id).catch(() => {
      if (prev) set((s) => ({ wines: [...s.wines, prev] }));
    });
  },

  updatePrices: async (id, prices) => {
    const prev = get().wines.find((w) => w.id === id);
    if (!prev) return;
    const updated = { ...prev, prices, updatedAt: new Date().toISOString() };
    set((s) => ({ wines: s.wines.map((w) => (w.id === id ? updated : w)) }));
    api.wines.patchPrices(id, prices).catch(() => {
      set((s) => ({ wines: s.wines.map((w) => (w.id === id ? prev : w)) }));
    });
  },

  updateStock: async (id, delta) => {
    const prev = get().wines.find((w) => w.id === id);
    if (!prev) return;
    const updated = { ...prev, stock: Math.max(0, prev.stock + delta), updatedAt: new Date().toISOString() };
    set((s) => ({ wines: s.wines.map((w) => (w.id === id ? updated : w)) }));
    api.wines.patchStock(id, delta).catch(() => {
      set((s) => ({ wines: s.wines.map((w) => (w.id === id ? prev : w)) }));
    });
  },
}));
