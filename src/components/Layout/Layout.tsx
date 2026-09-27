import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useUIStore } from '../../store/uiStore';

export function Layout() {
  const setMobileMenuOpen = useUIStore((s) => s.setMobileMenuOpen);

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Barra superior — solo mobile */}
        <div className="md:hidden sticky top-0 z-20 bg-burgundy-dark flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="text-white/80 hover:text-white p-1 -ml-1"
            title="Abrir menú"
          >
            <Menu size={22} />
          </button>
          <span className="text-white font-bold text-sm">Bodega de Amigos</span>
        </div>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
