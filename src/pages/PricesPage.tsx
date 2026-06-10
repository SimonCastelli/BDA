import { useState, useRef } from 'react';
import { Download, ArrowUpDown, Pencil, FileText, Wine } from 'lucide-react';
import { clsx } from 'clsx';
import { useWineStore } from '../store/wineStore';
import { WineCategory, WinePrices, CATEGORY_LABELS } from '../types';
import { formatCurrency } from '../utils/format';
import { exportPricesToExcel } from '../utils/excel';
import { generatePriceListPDF } from '../utils/pdf';
import { SearchBar } from '../components/ui/SearchBar';
import { CategoryBadge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';

type SortField = 'name' | 'bottle' | 'case' | 'market';
type SortDir = 'asc' | 'desc';

interface EditingCell {
  wineId: string;
  field: keyof WinePrices;
}

const ALL_CATEGORIES: WineCategory[] = ['tinto', 'blanco', 'rosado', 'espumante', 'dulce', 'otro'];

export function PricesPage() {
  const { wines, updatePrices } = useWineStore();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<WineCategory | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [editing, setEditing] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [pdfModal, setPdfModal] = useState(false);
  const [pdfCategory, setPdfCategory] = useState<WineCategory | null>(null);

  const filtered = wines
    .filter((w) => {
      if (categoryFilter && w.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          w.name.toLowerCase().includes(q) ||
          w.code.toLowerCase().includes(q) ||
          (w.winery ?? '').toLowerCase().includes(q) ||
          (w.varietal ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      let va: number | string = 0;
      let vb: number | string = 0;
      if (sortField === 'name') { va = a.name; vb = b.name; }
      else if (sortField === 'bottle') { va = a.prices.bottle; vb = b.prices.bottle; }
      else if (sortField === 'case') { va = a.prices.case; vb = b.prices.case; }
      else if (sortField === 'market') { va = a.prices.market; vb = b.prices.market; }
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  }

  function startEdit(wineId: string, field: keyof WinePrices, currentValue: number) {
    setEditing({ wineId, field });
    setEditValue(String(currentValue));
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function commitEdit() {
    if (!editing) return;
    const wine = wines.find((w) => w.id === editing.wineId);
    if (!wine) { setEditing(null); return; }
    const parsed = parseFloat(editValue.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0) {
      updatePrices(wine.id, { ...wine.prices, [editing.field]: parsed });
    }
    setEditing(null);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setEditing(null);
  }

  function SortButton({ field, label }: { field: SortField; label: string }) {
    return (
      <button
        onClick={() => toggleSort(field)}
        className="flex items-center gap-1 hover:text-burgundy transition-colors"
      >
        {label}
        <ArrowUpDown size={12} className={clsx(sortField === field ? 'text-burgundy' : 'text-gray-400')} />
      </button>
    );
  }

  function PriceCell({ wineId, field, value, prices }: { wineId: string; field: keyof WinePrices; value: number; prices: WinePrices }) {
    const isEditing = editing?.wineId === wineId && editing?.field === field;
    return (
      <td
        className={clsx(
          'table-cell cursor-pointer group relative',
          isEditing ? 'bg-yellow-50' : 'hover:bg-yellow-50'
        )}
        onClick={() => !isEditing && startEdit(wineId, field, value)}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            className="w-full px-1 py-0.5 text-sm bg-yellow-50 border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-400 text-right"
            min={0}
          />
        ) : (
          <span className="flex items-center justify-end gap-1.5">
            {formatCurrency(value)}
            <Pencil size={11} className="text-gray-300 group-hover:text-gray-400 transition-colors flex-shrink-0" />
          </span>
        )}
      </td>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Precios</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} vino{filtered.length !== 1 ? 's' : ''} mostrado{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setPdfCategory(null); setPdfModal(true); }} className="btn-secondary">
            <FileText size={16} />
            Lista PDF
          </button>
          <button onClick={() => exportPricesToExcel(wines)} className="btn-secondary">
            <Download size={16} />
            Exportar Excel
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre, código, bodega..."
        />
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCategoryFilter(null)}
            className={clsx(
              'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              categoryFilter === null
                ? 'bg-burgundy text-white border-burgundy'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            )}
          >
            Todos
          </button>
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                categoryFilter === cat
                  ? 'bg-burgundy text-white border-burgundy'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              )}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      <Modal open={pdfModal} onClose={() => setPdfModal(false)} title="Exportar Lista de Precios (PDF)" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Seleccioná la categoría a incluir en el PDF:</p>
          <div className="space-y-2">
            <button
              onClick={() => setPdfCategory(null)}
              className={clsx('w-full text-left px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors',
                pdfCategory === null ? 'bg-burgundy text-white border-burgundy' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
              )}
            >
              Todas las categorías
            </button>
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setPdfCategory(cat)}
                className={clsx('w-full text-left px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors',
                  pdfCategory === cat ? 'bg-burgundy text-white border-burgundy' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                )}
              >
                {CATEGORY_LABELS[cat]}
                <span className="ml-2 text-xs opacity-60">
                  ({wines.filter((w) => w.category === cat).length} vinos)
                </span>
              </button>
            ))}
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setPdfModal(false)} className="btn-secondary">Cancelar</button>
            <button
              onClick={() => { generatePriceListPDF(wines, pdfCategory); setPdfModal(false); }}
              className="btn-primary"
            >
              <FileText size={15} />
              Descargar PDF
            </button>
          </div>
        </div>
      </Modal>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Wine}
            title="Sin resultados"
            description="No se encontraron vinos con los filtros aplicados."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header text-left">
                    <SortButton field="name" label="Código / Nombre" />
                  </th>
                  <th className="table-header text-left">Categoría</th>
                  <th className="table-header text-right">Cosecha</th>
                  <th className="table-header text-right">
                    <SortButton field="bottle" label="Botella Suelta" />
                  </th>
                  <th className="table-header text-right">
                    <SortButton field="case" label="Caja Entera" />
                  </th>
                  <th className="table-header text-right">
                    <SortButton field="market" label="Mercado / Rest." />
                  </th>
                  <th className="table-header text-right">% Desc.</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((wine) => {
                  const discount =
                    wine.prices.market > 0
                      ? ((wine.prices.market - wine.prices.bottle) / wine.prices.market) * 100
                      : 0;
                  return (
                    <tr key={wine.id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell">
                        <div className="font-medium text-gray-900">{wine.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{wine.code}</div>
                      </td>
                      <td className="table-cell">
                        <CategoryBadge category={wine.category} />
                      </td>
                      <td className="table-cell text-right text-gray-500">{wine.vintage ?? '—'}</td>
                      <PriceCell wineId={wine.id} field="bottle" value={wine.prices.bottle} prices={wine.prices} />
                      <PriceCell wineId={wine.id} field="case" value={wine.prices.case} prices={wine.prices} />
                      <PriceCell wineId={wine.id} field="market" value={wine.prices.market} prices={wine.prices} />
                      <td className="table-cell text-right">
                        <span className={clsx('font-medium text-sm', discount > 0 ? 'text-green-600' : 'text-gray-400')}>
                          {discount > 0 ? `${discount.toFixed(1)}%` : '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
