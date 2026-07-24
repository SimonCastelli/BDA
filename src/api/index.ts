import { Wine, WinePrices, Order, OrderStatus, Contact, StockReception, Category } from '../types';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
  return res.json();
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) });
const put = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
const patch = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
const del = <T>(path: string) => request<T>(path, { method: 'DELETE' });

export const api = {
  wines: {
    getAll: () => get<Wine[]>('/wines'),
    create: (w: Wine) => post<Wine>('/wines', w),
    update: (id: string, w: Wine) => put<Wine>(`/wines/${id}`, w),
    remove: (id: string) => del<{ ok: boolean }>(`/wines/${id}`),
    patchStock: (id: string, delta: number) => patch<Wine>(`/wines/${id}/stock`, { delta }),
    patchPrices: (id: string, prices: WinePrices) =>
      patch<Wine>(`/wines/${id}/prices`, { prices }),
  },
  orders: {
    getAll: () => get<Order[]>('/orders'),
    create: (o: Order) => post<Order>('/orders', o),
    update: (id: string, o: Order) => put<Order>(`/orders/${id}`, o),
    patchStatus: (id: string, status: OrderStatus) =>
      patch<Order>(`/orders/${id}/status`, { status }),
    remove: (id: string) => del<{ ok: boolean }>(`/orders/${id}`),
  },
  contacts: {
    getAll: () => get<Contact[]>('/contacts'),
    create: (c: Contact) => post<Contact>('/contacts', c),
    update: (id: string, c: Contact) => put<Contact>(`/contacts/${id}`, c),
    remove: (id: string) => del<{ ok: boolean }>(`/contacts/${id}`),
  },
  receptions: {
    getAll: () => get<StockReception[]>('/receptions'),
    create: (r: StockReception) => post<StockReception>('/receptions', r),
    remove: (id: string) => del<{ ok: boolean }>(`/receptions/${id}`),
  },
  categories: {
    getAll: () => get<Category[]>('/categories'),
    create: (c: Category) => post<Category>('/categories', c),
    update: (id: string, c: Category) => put<Category>(`/categories/${id}`, c),
    remove: (id: string) => del<{ ok: boolean }>(`/categories/${id}`),
  },
};
