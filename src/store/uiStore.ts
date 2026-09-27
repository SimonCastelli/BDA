import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIStore {
  // Desktop: colapsa el sidebar a una franja de íconos. Se persiste entre sesiones.
  sidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;
  // Mobile: abre/cierra el sidebar como panel superpuesto. No se persiste (arranca siempre cerrado).
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebarCollapsed: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      mobileMenuOpen: false,
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
    }),
    {
      name: 'bda-ui',
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }),
    }
  )
);
