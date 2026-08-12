import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Receipt, Trash2, FileText, Pencil } from 'lucide-react';
import { clsx } from 'clsx';
import { useLiquidacionStore } from '../store/liquidacionStore';
import { formatCurrency, formatDate } from '../utils/format';
import { generateLiquidacionPDF } from '../utils/pdf';
import { SearchBar } from '../components/ui/SearchBar';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export function LiquidacionesPage() {
  const navigate = useNavigate();
  const { liquidaciones, deleteLiquidacion } = useLiquidacionStore();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = liquidaciones.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.liquidacionNumber.toLowerCase().includes(q) ||
      l.client.name.toLowerCase().includes(q) ||
      (l.client.company ?? '').toLowerCase().includes(q)
    );
  });

  const total = filtered.reduce((s, l) => s + l.total, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Liquidaciones</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} liquidación{filtered.length !== 1 ? 'es' : ''}</p>
        </div>
        <Link to="/liquidaciones/nueva" className="btn-primary">
          <Plus size={16} />
          Nueva Liquidación
        </Link>
      </div>

      {liquidaciones.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4">
            <p className="text-sm text-gray-500">Total liquidaciones</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{liquidaciones.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500">Monto total</p>
            <p className="text-2xl font-bold text-burgundy mt-1">{formatCurrency(total)}</p>
          </div>
        </div>
      )}

      <SearchBar value={search} onChange={setSearch} placeholder="Buscar por número, cliente o negocio..." />

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Sin liquidaciones"
            description={search ? 'No hay resultados para esa búsqueda.' : 'Creá tu primera liquidación con el botón de arriba.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header text-left">N°</th>
                  <th className="table-header text-left">Cliente / Negocio</th>
                  <th className="table-header text-left">Fecha</th>
                  <th className="table-header text-right">Ítems</th>
                  <th className="table-header text-right">Total</th>
                  <th className="table-header text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((liq) => (
                  <tr key={liq.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell">
                      <span className="font-mono text-sm font-semibold text-burgundy">{liq.liquidacionNumber}</span>
                    </td>
                    <td className="table-cell">
                      <div className="font-medium text-gray-900">{liq.client.company || liq.client.name}</div>
                      {liq.client.company && (
                        <div className="text-xs text-gray-400">{liq.client.name}</div>
                      )}
                      {liq.client.cuit && (
                        <div className="text-xs text-gray-400">CUIT: {liq.client.cuit}</div>
                      )}
                    </td>
                    <td className="table-cell text-sm text-gray-500">{formatDate(liq.createdAt)}</td>
                    <td className="table-cell text-right text-sm text-gray-600">{liq.items.length}</td>
                    <td className="table-cell text-right font-semibold text-gray-900">{formatCurrency(liq.total)}</td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => generateLiquidacionPDF(liq)}
                          className="p-1.5 rounded hover:bg-burgundy/10 text-gray-400 hover:text-burgundy transition-colors"
                          title="Descargar PDF"
                        >
                          <FileText size={15} />
                        </button>
                        <button
                          onClick={() => navigate(`/liquidaciones/${liq.id}/editar`)}
                          className="p-1.5 rounded hover:bg-gold/20 text-gray-400 hover:text-gold-dark transition-colors"
                          title="Editar"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteId(liq.id)}
                          className="p-1.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={15} />
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
        open={!!deleteId}
        title="Eliminar liquidación"
        message="¿Seguro que querés eliminar esta liquidación? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        danger
        onConfirm={async () => { if (deleteId) { await deleteLiquidacion(deleteId); setDeleteId(null); } }}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
