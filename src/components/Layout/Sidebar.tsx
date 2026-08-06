import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Tag, ClipboardList, Plus, Users, PackagePlus, Settings, Receipt } from 'lucide-react';
import { clsx } from 'clsx';

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
  return (
    <aside className="w-60 min-h-screen bg-burgundy-dark flex flex-col">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gold flex items-center justify-center flex-shrink-0">
            <span className="text-burgundy-dark font-bold text-sm">BDA</span>
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">Bodega de Amigos</div>
            <div className="text-gold-light/60 text-xs">Gestión de Stock</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              )
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Quick action */}
      <div className="px-3 pb-4">
        <NavLink
          to="/pedidos/nuevo"
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-semibold
                     bg-gold text-burgundy-dark hover:bg-gold-dark transition-colors"
        >
          <Plus size={17} />
          Nuevo Pedido
        </NavLink>
      </div>

      {/* Version */}
      <div className="px-5 pb-4 text-white/20 text-xs">v1.0.0</div>
    </aside>
  );
}
