import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Tag, ClipboardList, Plus, Users, PackagePlus, Settings, Receipt, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { clsx } from 'clsx';
import { useUIStore } from '../../store/uiStore';

const navItems = [
  { to: '/',               icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/stock',          icon: Package,         label: 'Inventario' },
  { to: '/precios',        icon: Tag,             label: 'Precios' },
  { to: '/pedidos',        icon: ClipboardList,   label: 'Pedidos' },
  { to: '/liquidaciones',  icon: Receipt,         label: 'Liquidaciones' },
  { to: '/contactos',      icon: Users,           label: 'Contactos' },
  { to: '/recepcion',      icon: PackagePlus,     label: 'Recepción' },
  { to: '/configuracion',  icon: Settings,        label: 'Configuración' },
];

export function Sidebar() {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebarCollapsed = useUIStore((s) => s.toggleSidebarCollapsed);
  const mobileMenuOpen = useUIStore((s) => s.mobileMenuOpen);
  const setMobileMenuOpen = useUIStore((s) => s.setMobileMenuOpen);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      {/* Overlay de fondo en mobile, cierra el menú al tocarlo */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      <aside
        className={clsx(
          'min-h-screen bg-burgundy-dark flex flex-col flex-shrink-0 transition-all duration-200',
          // Mobile: panel fijo off-canvas
          'fixed inset-y-0 left-0 z-40 w-64 transform',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: estático, ancho según colapso
          'md:static md:translate-x-0 md:z-auto',
          sidebarCollapsed ? 'md:w-[72px]' : 'md:w-60'
        )}
      >
        {/* Logo */}
        <div className={clsx('px-5 py-6 border-b border-white/10 flex items-center', sidebarCollapsed ? 'md:justify-center md:px-3' : 'justify-between')}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gold flex items-center justify-center flex-shrink-0">
              <span className="text-burgundy-dark font-bold text-sm">BDA</span>
            </div>
            <div className={clsx('min-w-0', sidebarCollapsed && 'md:hidden')}>
              <div className="text-white font-bold text-sm leading-tight truncate">Bodega de Amigos</div>
              <div className="text-gold-light/60 text-xs truncate">Gestión de Stock</div>
            </div>
          </div>
          {/* Toggle de colapso — solo desktop */}
          <button
            onClick={toggleSidebarCollapsed}
            className={clsx('hidden md:flex items-center justify-center w-6 h-6 rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0', sidebarCollapsed && 'md:hidden')}
            title="Colapsar menú"
          >
            <ChevronsLeft size={15} />
          </button>
        </div>
        {sidebarCollapsed && (
          <button
            onClick={toggleSidebarCollapsed}
            className="hidden md:flex items-center justify-center py-2 text-white/40 hover:text-white hover:bg-white/10 transition-colors border-b border-white/10"
            title="Expandir menú"
          >
            <ChevronsRight size={15} />
          </button>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={closeMobileMenu}
              title={sidebarCollapsed ? label : undefined}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  sidebarCollapsed && 'md:justify-center md:px-0',
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                )
              }
            >
              <Icon size={17} className="flex-shrink-0" />
              <span className={clsx(sidebarCollapsed && 'md:hidden')}>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Quick action */}
        <div className="px-3 pb-4">
          <NavLink
            to="/pedidos/nuevo"
            onClick={closeMobileMenu}
            title={sidebarCollapsed ? 'Nuevo Pedido' : undefined}
            className={clsx(
              'flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-semibold',
              'bg-gold text-burgundy-dark hover:bg-gold-dark transition-colors',
              sidebarCollapsed && 'md:justify-center md:px-0'
            )}
          >
            <Plus size={17} className="flex-shrink-0" />
            <span className={clsx(sidebarCollapsed && 'md:hidden')}>Nuevo Pedido</span>
          </NavLink>
        </div>

        {/* Version */}
        <div className={clsx('px-5 pb-4 text-white/20 text-xs', sidebarCollapsed && 'md:hidden')}>v1.0.0</div>
      </aside>
    </>
  );
}
