import { create } from 'zustand';
import { StockReception, StockReceptionItem } from '../types';
import { generateId } from '../utils/format';
import { api } from '../api';

interface ReceptionStore {
  receptions: StockReception[];
  isLoading: boolean;
  init: () => Promise<void>;
  addReception: (items: StockReceptionItem[], notes?: string) => Promise<StockReception>;
  deleteReception: (id: string) => Promise<void>;
  getNextNumber: () => string;
}

export const useReceptionStore = create<ReceptionStore>()((set, get) => ({
  receptions: [],
  isLoading: false,

  init: async () => {
    set({ isLoading: true });
    const receptions = await api.receptions.getAll();
    set({ receptions, isLoading: false });
  },

  getNextNumber: () => {
    const nums = get()
      .receptions.map((r) => parseInt(r.receptionNumber.replace('REC-', ''), 10))
      .filter((n) => !isNaN(n));
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `REC-${String(next).padStart(4, '0')}`;
  },

  addReception: async (items, notes) => {
    const reception: StockReception = {
      id: generateId(),
      receptionNumber: get().getNextNumber(),
      items,
      totalBottles: items.reduce((s, i) => s + i.quantity, 0),
      newWinesCount: items.filter((i) => i.isNew).length,
      notes,
      createdAt: new Date().toISOString(),
    };
    await api.receptions.create(reception);
    set((s) => ({ receptions: [reception, ...s.receptions] }));
    return reception;
  },

  deleteReception: async (id) => {
    await api.receptions.remove(id);
    set((s) => ({ receptions: s.receptions.filter((r) => r.id !== id) }));
  },
}));
