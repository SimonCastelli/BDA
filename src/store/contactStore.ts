import { create } from 'zustand';
import { Contact } from '../types';
import { generateId } from '../utils/format';
import { api } from '../api';

interface ContactStore {
  contacts: Contact[];
  isLoading: boolean;
  init: () => Promise<void>;
  addContact: (data: Omit<Contact, 'id' | 'serialNumber' | 'createdAt' | 'updatedAt'>) => Promise<Contact>;
  updateContact: (id: string, data: Partial<Omit<Contact, 'id' | 'createdAt'>>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  getNextSerial: () => number;
}

export const useContactStore = create<ContactStore>()((set, get) => ({
  contacts: [],
  isLoading: false,

  init: async () => {
    set({ isLoading: true });
    let contacts = await api.contacts.getAll();

    // Assign serialNumbers to contacts that don't have one yet
    const withoutSerial = contacts.filter((c) => !c.serialNumber);
    if (withoutSerial.length > 0) {
      const maxSerial = Math.max(0, ...contacts.filter((c) => c.serialNumber).map((c) => c.serialNumber!));
      const sorted = [...withoutSerial].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      let next = maxSerial + 1;
      for (const contact of sorted) {
        const updated = { ...contact, serialNumber: next++, updatedAt: new Date().toISOString() };
        await api.contacts.update(contact.id, updated);
        contacts = contacts.map((c) => (c.id === contact.id ? updated : c));
      }
    }

    set({ contacts, isLoading: false });
  },

  getNextSerial: () => {
    const serials = get().contacts.map((c) => c.serialNumber ?? 0);
    return serials.length > 0 ? Math.max(...serials) + 1 : 1;
  },

  addContact: async (data) => {
    const contact: Contact = {
      ...data,
      id: generateId(),
      serialNumber: get().getNextSerial(),
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
