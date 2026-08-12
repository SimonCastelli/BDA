import { create } from 'zustand';
import { Liquidacion } from '../types';
import { generateId } from '../utils/format';
import { api } from '../api';

interface LiquidacionStore {
  liquidaciones: Liquidacion[];
  isLoading: boolean;
  init: () => Promise<void>;
  addLiquidacion: (data: Omit<Liquidacion, 'id' | 'liquidacionNumber' | 'createdAt'>) => Promise<Liquidacion>;
  updateLiquidacion: (id: string, data: Omit<Liquidacion, 'id' | 'liquidacionNumber' | 'createdAt'>) => Promise<void>;
  deleteLiquidacion: (id: string) => Promise<void>;
  getNextNumber: () => string;
}

export const useLiquidacionStore = create<LiquidacionStore>()((set, get) => ({
  liquidaciones: [],
  isLoading: false,

  init: async () => {
    set({ isLoading: true });
    const liquidaciones = await api.liquidaciones.getAll();
    set({ liquidaciones, isLoading: false });
  },

  getNextNumber: () => {
    const nums = get()
      .liquidaciones.map((l) => parseInt(l.liquidacionNumber.replace('LIQ-', ''), 10))
      .filter((n) => !isNaN(n));
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `LIQ-${String(next).padStart(4, '0')}`;
  },

  addLiquidacion: async (data) => {
    const liquidacion: Liquidacion = {
      ...data,
      id: generateId(),
      liquidacionNumber: get().getNextNumber(),
      createdAt: new Date().toISOString(),
    };
    await api.liquidaciones.create(liquidacion);
    set((s) => ({ liquidaciones: [liquidacion, ...s.liquidaciones] }));
    return liquidacion;
  },

  updateLiquidacion: async (id, data) => {
    const existing = get().liquidaciones.find((l) => l.id === id);
    if (!existing) return;
    const updated: Liquidacion = { ...existing, ...data };
    await api.liquidaciones.update(id, updated);
    set((s) => ({ liquidaciones: s.liquidaciones.map((l) => (l.id === id ? updated : l)) }));
  },

  deleteLiquidacion: async (id) => {
    await api.liquidaciones.remove(id);
    set((s) => ({ liquidaciones: s.liquidaciones.filter((l) => l.id !== id) }));
  },
}));
