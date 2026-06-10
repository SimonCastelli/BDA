import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Contact } from '../types';
import { generateId } from '../utils/format';

interface ContactStore {
  contacts: Contact[];
  addContact: (data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => Contact;
  updateContact: (id: string, data: Partial<Omit<Contact, 'id' | 'createdAt'>>) => void;
  deleteContact: (id: string) => void;
}

export const useContactStore = create<ContactStore>()(
  persist(
    (set) => ({
      contacts: [],

      addContact: (data) => {
        const contact: Contact = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ contacts: [...s.contacts, contact] }));
        return contact;
      },

      updateContact: (id, data) => {
        set((s) => ({
          contacts: s.contacts.map((c) =>
            c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c
          ),
        }));
      },

      deleteContact: (id) => {
        set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) }));
      },
    }),
    { name: 'bda-contacts' }
  )
);
