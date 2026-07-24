import { create } from 'zustand';
import { Category } from '../types';
import { generateId } from '../utils/format';
import { api } from '../api';

interface CategoryStore {
  categories: Category[];
  isLoading: boolean;
  init: () => Promise<void>;
  addCategory: (data: Omit<Category, 'id'>) => Promise<Category>;
  updateCategory: (id: string, data: Partial<Omit<Category, 'id'>>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getLabel: (id: string) => string;
  getColor: (id: string) => string;
}

export const useCategoryStore = create<CategoryStore>()((set, get) => ({
  categories: [],
  isLoading: false,

  init: async () => {
    set({ isLoading: true });
    const categories = await api.categories.getAll();
    set({ categories, isLoading: false });
  },

  addCategory: async (data) => {
    const category: Category = { ...data, id: generateId() };
    await api.categories.create(category);
    set((s) => ({ categories: [...s.categories, category] }));
    return category;
  },

  updateCategory: async (id, data) => {
    const cat = get().categories.find((c) => c.id === id);
    if (!cat) return;
    const updated = { ...cat, ...data };
    await api.categories.update(id, updated);
    set((s) => ({ categories: s.categories.map((c) => (c.id === id ? updated : c)) }));
  },

  deleteCategory: async (id) => {
    await api.categories.remove(id);
    set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
  },

  getLabel: (id) => get().categories.find((c) => c.id === id)?.label ?? id,
  getColor: (id) =>
    get().categories.find((c) => c.id === id)?.color ??
    'bg-gray-100 text-gray-700 border-gray-200',
}));
