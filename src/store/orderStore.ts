import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Order, OrderStatus } from '../types';
import { generateId } from '../utils/format';

interface OrderStore {
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) => Order;
  updateOrder: (id: string, updates: Partial<Omit<Order, 'id' | 'orderNumber' | 'createdAt'>>) => void;
  updateStatus: (id: string, status: OrderStatus) => void;
  deleteOrder: (id: string) => void;
  getNextOrderNumber: () => string;
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      orders: [],

      getNextOrderNumber: () => {
        const orders = get().orders;
        const nums = orders
          .map((o) => parseInt(o.orderNumber.replace('BDA-', ''), 10))
          .filter((n) => !isNaN(n));
        const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
        return `BDA-${String(next).padStart(4, '0')}`;
      },

      addOrder: (orderData) => {
        const order: Order = {
          ...orderData,
          id: generateId(),
          orderNumber: get().getNextOrderNumber(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ orders: [order, ...s.orders] }));
        return order;
      },

      updateOrder: (id, updates) => {
        set((s) => ({
          orders: s.orders.map((o) => (o.id === id ? { ...o, ...updates } : o)),
        }));
      },

      updateStatus: (id, status) => {
        set((s) => ({
          orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)),
        }));
      },

      deleteOrder: (id) => {
        set((s) => ({ orders: s.orders.filter((o) => o.id !== id) }));
      },
    }),
    { name: 'bda-orders' }
  )
);
