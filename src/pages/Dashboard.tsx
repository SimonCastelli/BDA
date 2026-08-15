import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Package, ClipboardList, TrendingDown, DollarSign, Plus, ArrowRight, Grape, Wine, Download, Upload } from 'lucide-react';
import { useWineStore } from '../store/wineStore';
import { useOrderStore } from '../store/orderStore';
import { useCategoryStore } from '../store/categoryStore';
import { formatCurrency, formatDate } from '../utils/format';
import { CategoryBadge, StatusBadge } from '../components/ui/Badge';
import { api } from '../api';

const TODAY = new Date().toLocaleDateString('es-AR', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export function Dashboard() {
  const wines = useWineStore((s) => s.wines);
  const orders = useOrderStore((s) => s.orders);
  const { categories } = useCategoryStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    const data = await api.backup.export();
    const date = new Date().toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bda-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const data = JSON.parse(text);
    await api.backup.restore(data);
    window.location.reload();
  }

  const totalBottles = wines.reduce((acc, w) => acc + w.stock, 0);
  const criticalWines = wines.filter((w) => w.stock <= 6);
  const stockValue = wines.reduce((acc, w) => acc + w.stock * w.prices.bottle, 0);

  const lastOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const categoryStock = categories.map((cat) => ({
    category: cat.id,
    count: wines.filter((w) => w.category === cat.id).reduce((acc, w) => acc + w.stock, 0),
  })).filter((c) => c.count > 0);

  const maxCategoryStock = Math.max(...categoryStock.map((c) => c.count), 1);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">{TODAY}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-secondary flex items-center gap-1.5 text-sm" title="Descargar backup JSON">
            <Download size={15} />
            Exportar backup
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="btn-secondary flex items-center gap-1.5 text-sm" title="Restaurar desde backup JSON">
            <Upload size={15} />
            Restaurar backup
          </button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <Link to="/pedidos/nuevo" className="btn-primary">
            <Plus size={16} />
            Nuevo Pedido
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-burgundy/10 flex items-center justify-center flex-shrink-0">
            <Grape size={22} className="text-burgundy" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Vinos</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{wines.length}</p>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Wine size={22} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Botellas</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{totalBottles.toLocaleString('es-AR')}</p>
          </div>
        </div>

        <div className={`card p-5 flex items-center gap-4 ${criticalWines.length > 0 ? 'border-red-200 bg-red-50/30' : ''}`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${criticalWines.length > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
            <TrendingDown size={22} className={criticalWines.length > 0 ? 'text-red-600' : 'text-gray-500'} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock Crítico</p>
            <p className={`text-2xl font-bold mt-0.5 ${criticalWines.length > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {criticalWines.length}
            </p>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
            <DollarSign size={22} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Valor del Stock</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{formatCurrency(stockValue)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ClipboardList size={18} className="text-burgundy" />
              <h2 className="font-semibold text-gray-800">Últimos Pedidos</h2>
            </div>
            <Link to="/pedidos" className="text-xs text-burgundy hover:text-burgundy-dark font-medium flex items-center gap-1">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>

          {lastOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package size={32} className="text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No hay pedidos aún</p>
              <Link to="/pedidos/nuevo" className="mt-3 text-xs text-burgundy font-medium hover:underline">
                Crear primer pedido
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {lastOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    to={`/pedidos/${order.id}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-cream/60 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <StatusBadge status={order.status} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{order.client.name}</p>
                        <p className="text-xs text-gray-500">{order.orderNumber} · {formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <span className="text-sm font-semibold text-gray-800">{formatCurrency(order.total)}</span>
                      <ArrowRight size={14} className="text-gray-400" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <Package size={18} className="text-burgundy" />
            <h2 className="font-semibold text-gray-800">Stock por Categoría</h2>
          </div>
          <div className="p-5 space-y-3">
            {categoryStock.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Sin datos de stock</p>
            ) : (
              categoryStock.map(({ category, count }) => (
                <div key={category} className="flex items-center gap-3">
                  <div className="w-24 flex-shrink-0">
                    <CategoryBadge category={category} />
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-burgundy rounded-full transition-all duration-500"
                        style={{ width: `${(count / maxCategoryStock) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 w-10 text-right">{count}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {criticalWines.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-red-100 bg-red-50/40 rounded-t-xl">
            <TrendingDown size={18} className="text-red-600" />
            <h2 className="font-semibold text-red-700">Vinos con Stock Crítico</h2>
            <span className="ml-auto text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">
              {criticalWines.length} vino{criticalWines.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="overflow-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr>
                  <th className="table-header">Nombre</th>
                  <th className="table-header">Código</th>
                  <th className="table-header">Categoría</th>
                  <th className="table-header text-right">Stock</th>
                </tr>
              </thead>
              <tbody>
                {criticalWines.map((wine) => (
                  <tr key={wine.id} className="hover:bg-red-50/30">
                    <td className="table-cell font-medium text-gray-800">{wine.name}</td>
                    <td className="table-cell">
                      <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">{wine.code}</code>
                    </td>
                    <td className="table-cell">
                      <CategoryBadge category={wine.category} />
                    </td>
                    <td className="table-cell text-right">
                      <span className="text-sm font-bold text-red-600">{wine.stock}</span>
                      <span className="text-xs text-gray-400 ml-1">bot.</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
