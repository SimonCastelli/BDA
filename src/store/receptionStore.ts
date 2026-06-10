import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StockReception, StockReceptionItem } from '../types';
import { generateId } from '../utils/format';

interface ReceptionStore {
  receptions: StockReception[];
  addReception: (items: StockReceptionItem[], notes?: string) => StockReception;
  deleteReception: (id: string) => void;
  getNextNumber: () => string;
}

export const useReceptionStore = create<ReceptionStore>()(
  persist(
    (set, get) => ({
      receptions: [],

      getNextNumber: () => {
        const nums = get().receptions
          .map((r) => parseInt(r.receptionNumber.replace('REC-', ''), 10))
          .filter((n) => !isNaN(n));
        const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
        return `REC-${String(next).padStart(4, '0')}`;
      },

      addReception: (items, notes) => {
        const reception: StockReception = {
          id: generateId(),
          receptionNumber: get().getNextNumber(),
          items,
          totalBottles: items.reduce((s, i) => s + i.quantity, 0),
          newWinesCount: items.filter((i) => i.isNew).length,
          notes,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ receptions: [reception, ...s.receptions] }));
        return reception;
      },

      deleteReception: (id) => {
        set((s) => ({ receptions: s.receptions.filter((r) => r.id !== id) }));
      },
    }),
    { name: 'bda-receptions' }
  )
);
