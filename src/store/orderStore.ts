import { create } from 'zustand';
import { Order, OrderStatus } from '../types';
import { generateId } from '../utils/format';
import { api } from '../api';

interface OrderStore {
  orders: Order[];
  isLoading: boolean;
  init: () => Promise<void>;
  addOrder: (order: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) => Promise<Order>;
  updateOrder: (id: string, updates: Partial<Omit<Order, 'id' | 'orderNumber' | 'createdAt'>>) => Promise<void>;
  updateStatus: (id: string, status: OrderStatus) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  getNextOrderNumber: () => string;
}

export const useOrderStore = create<OrderStore>()((set, get) => ({
  orders: [],
  isLoading: false,

  init: async () => {
    set({ isLoading: true });
    const orders = await api.orders.getAll();
    set({ orders, isLoading: false });
  },

  getNextOrderNumber: () => {
    const nums = get()
      .orders.map((o) => parseInt(o.orderNumber.replace('BDA-', ''), 10))
      .filter((n) => !isNaN(n));
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `BDA-${String(next).padStart(4, '0')}`;
  },

  addOrder: async (orderData) => {
    const order: Order = {
      ...orderData,
      id: generateId(),
      orderNumber: get().getNextOrderNumber(),
      createdAt: new Date().toISOString(),
    };
    await api.orders.create(order);
    set((s) => ({ orders: [order, ...s.orders] }));
    return order;
  },

  updateOrder: async (id, updates) => {
    const order = get().orders.find((o) => o.id === id);
    if (!order) return;
    const updated = { ...order, ...updates };
    await api.orders.update(id, updated);
    set((s) => ({ orders: s.orders.map((o) => (o.id === id ? updated : o)) }));
  },

  updateStatus: async (id, status) => {
    await api.orders.patchStatus(id, status);
    set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)) }));
  },

  deleteOrder: async (id) => {
    await api.orders.remove(id);
    set((s) => ({ orders: s.orders.filter((o) => o.id !== id) }));
  },
}));
