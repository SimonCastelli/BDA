import { create } from 'zustand';
import { Order, OrderStatus } from '../types';
import { generateId } from '../utils/format';
import { api } from '../api';

interface OrderStore {
  orders: Order[];
  isLoading: boolean;
  init: () => Promise<void>;
  addOrder: (
    order: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>,
    contactSerial?: number
  ) => Promise<Order>;
  updateOrder: (id: string, updates: Partial<Omit<Order, 'id' | 'orderNumber' | 'createdAt'>>) => Promise<void>;
  updateStatus: (id: string, status: OrderStatus) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
}

export const useOrderStore = create<OrderStore>()((set, get) => ({
  orders: [],
  isLoading: false,

  init: async () => {
    set({ isLoading: true });
    const orders = await api.orders.getAll();
    set({ orders, isLoading: false });
  },

  addOrder: async (orderData, contactSerial) => {
    let orderNumber: string;

    if (orderData.contactId && contactSerial !== undefined) {
      const contactOrders = get().orders.filter((o) => o.contactId === orderData.contactId);
      const seq = contactOrders.length + 1;
      orderNumber = `${String(contactSerial).padStart(3, '0')}-${String(seq).padStart(4, '0')}`;
    } else {
      const nums = get()
        .orders.map((o) => parseInt(o.orderNumber.replace('BDA-', ''), 10))
        .filter((n) => !isNaN(n));
      const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
      orderNumber = `BDA-${String(next).padStart(4, '0')}`;
    }

    const order: Order = {
      ...orderData,
      id: generateId(),
      orderNumber,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ orders: [order, ...s.orders] }));
    api.orders.create(order).catch(() => {
      set((s) => ({ orders: s.orders.filter((o) => o.id !== order.id) }));
    });
    return order;
  },

  updateOrder: async (id, updates) => {
    const prev = get().orders.find((o) => o.id === id);
    if (!prev) return;
    const updated = { ...prev, ...updates };
    set((s) => ({ orders: s.orders.map((o) => (o.id === id ? updated : o)) }));
    api.orders.update(id, updated).catch(() => {
      set((s) => ({ orders: s.orders.map((o) => (o.id === id ? prev : o)) }));
    });
  },

  updateStatus: async (id, status) => {
    const prev = get().orders.find((o) => o.id === id);
    set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)) }));
    api.orders.patchStatus(id, status).catch(() => {
      if (prev) set((s) => ({ orders: s.orders.map((o) => (o.id === id ? prev : o)) }));
    });
  },

  deleteOrder: async (id) => {
    const prev = get().orders.find((o) => o.id === id);
    set((s) => ({ orders: s.orders.filter((o) => o.id !== id) }));
    api.orders.remove(id).catch(() => {
      if (prev) set((s) => ({ orders: [prev, ...s.orders] }));
    });
  },
}));
