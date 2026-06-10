import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Trash2, ShoppingBag } from 'lucide-react';
import { clsx } from 'clsx';
import { useOrderStore } from '../store/orderStore';
import { OrderStatus, STATUS_LABELS } from '../types';
import { formatCurrency, formatDateShort } from '../utils/format';
import { SearchBar } from '../components/ui/SearchBar';
import { StatusBadge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

type SortField = 'date' | 'total';
type SortDir = 'asc' | 'desc';
type StatusFilter = OrderStatus | 'all';

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'draft', label: STATUS_LABELS.draft },
  { value: 'confirmed', label: STATUS_LABELS.confirmed },
  { value: 'delivered', label: STATUS_LABELS.delivered },
  { value: 'cancelled', label: STATUS_LABELS.cancelled },
];

export function OrdersPage() {
  const navigate = useNavigate();
  const { orders, deleteOrder } = useOrderStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = orders
    .filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          o.orderNumber.toLowerCase().includes(q) ||
          o.client.name.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortField === 'date') {
        const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return sortDir === 'asc' ? diff : -diff;
      }
      return sortDir === 'asc' ? a.total - b.total : b.total - a.total;
    });

  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const orderToDelete = orders.find((o) => o.id === deleteId);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('desc'); }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} pedido{filtered.length !== 1 ? 's' : ''} mostrado{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => navigate('/pedidos/nuevo')} className="btn-primary">
          <Plus size={16} />
          Nuevo Pedido
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Total pedidos</p>
          <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Facturado</p>
          <p className="text-2xl font-bold text-burgundy">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Confirmados</p>
          <p className="text-2xl font-bold text-blue-600">{orders.filter((o) => o.status === 'confirmed').length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Entregados</p>
          <p className="text-2xl font-bold text-green-600">{orders.filter((o) => o.status === 'delivered').length}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Buscar por N° o cliente..."
        />
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                statusFilter === f.value
                  ? 'bg-burgundy text-white border-burgundy'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Sin pedidos"
            description={search || statusFilter !== 'all' ? 'No hay pedidos con los filtros aplicados.' : 'Todavía no hay pedidos. ¡Creá el primero!'}
            action={
              !search && statusFilter === 'all' ? (
                <button onClick={() => navigate('/pedidos/nuevo')} className="btn-primary">
                  <Plus size={16} /> Nuevo Pedido
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header text-left">N° Pedido</th>
                  <th className="table-header text-left">
                    <button onClick={() => toggleSort('date')} className="flex items-center gap-1 hover:text-burgundy transition-colors">
                      Fecha
                    </button>
                  </th>
                  <th className="table-header text-left">Cliente</th>
                  <th className="table-header text-right">Items</th>
                  <th className="table-header text-right">
                    <button onClick={() => toggleSort('total')} className="flex items-center gap-1 hover:text-burgundy transition-colors ml-auto">
                      Total
                    </button>
                  </th>
                  <th className="table-header text-left">Estado</th>
                  <th className="table-header text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell">
                      <span className="font-mono text-sm font-semibold text-burgundy">{order.orderNumber}</span>
                    </td>
                    <td className="table-cell text-gray-500">{formatDateShort(order.createdAt)}</td>
                    <td className="table-cell">
                      <div className="font-medium text-gray-900">{order.client.name}</div>
                      {order.client.phone && <div className="text-xs text-gray-400">{order.client.phone}</div>}
                    </td>
                    <td className="table-cell text-right text-gray-500">{order.items.length}</td>
                    <td className="table-cell text-right font-semibold text-gray-900">{formatCurrency(order.total)}</td>
                    <td className="table-cell"><StatusBadge status={order.status} /></td>
                    <td className="table-cell">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/pedidos/${order.id}`)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-burgundy transition-colors"
                          title="Ver detalle"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteId(order.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteOrder(deleteId); setDeleteId(null); }}
        title="Eliminar pedido"
        message={`¿Estás seguro que querés eliminar el pedido ${orderToDelete?.orderNumber ?? ''}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
      />
    </div>
  );
}
