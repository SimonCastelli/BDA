import { create } from 'zustand';
import { Contact } from '../types';
import { generateId } from '../utils/format';
import { api } from '../api';

interface ContactStore {
  contacts: Contact[];
  isLoading: boolean;
  init: () => Promise<void>;
  addContact: (data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Contact>;
  updateContact: (id: string, data: Partial<Omit<Contact, 'id' | 'createdAt'>>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
}

export const useContactStore = create<ContactStore>()((set, get) => ({
  contacts: [],
  isLoading: false,

  init: async () => {
    set({ isLoading: true });
    const contacts = await api.contacts.getAll();
    set({ contacts, isLoading: false });
  },

  addContact: async (data) => {
    const contact: Contact = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await api.contacts.create(contact);
    set((s) => ({ contacts: [...s.contacts, contact] }));
    return contact;
  },

  updateContact: async (id, data) => {
    const contact = get().contacts.find((c) => c.id === id);
    if (!contact) return;
    const updated = { ...contact, ...data, updatedAt: new Date().toISOString() };
    await api.contacts.update(id, updated);
    set((s) => ({ contacts: s.contacts.map((c) => (c.id === id ? updated : c)) }));
  },

  deleteContact: async (id) => {
    await api.contacts.remove(id);
    set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) }));
  },
}));
