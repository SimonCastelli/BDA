import { useState, useMemo, useRef } from 'react';
import { Plus, Download, Edit2, Trash2, Package, ChevronUp, ChevronDown, Barcode, Upload, FileSpreadsheet, AlertTriangle, CheckCircle } from 'lucide-react';
import ReactBarcode from 'react-barcode';
import { useWineStore } from '../store/wineStore';
import { useCategoryStore } from '../store/categoryStore';
import { Wine } from '../types';
import { formatCurrency } from '../utils/format';
import { exportStockToExcel, downloadWineTemplate, importWinesFromExcel, ImportedWine } from '../utils/excel';
import { CategoryBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { SearchBar } from '../components/ui/SearchBar';
import { EmptyState } from '../components/ui/EmptyState';

type SortField = 'name' | 'category' | 'stock' | 'price';
type SortDir = 'asc' | 'desc';

const EMPTY_FORM = {
  name: '', code: '', category: '',
  vintage: '', region: '', winery: '', varietal: '',
  stock: '', bottlesPerCase: '6',
  priceBottle: '', priceCase: '', priceMarket: '', notes: '',
};
type FormState = typeof EMPTY_FORM;

interface WineFormProps {
  initial: FormState;
  onSubmit: (data: FormState) => void;
  onCancel: () => void;
  submitLabel: string;
}

function WineForm({ initial, onSubmit, onCancel, submitLabel }: WineFormProps) {
  const categories = useCategoryStore((s) => s.categories);
  const [form, setForm] = useState<FormState>(() => ({
    ...initial,
    category: initial.category || categories[0]?.id || '',
  }));
  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Nombre *</label>
          <input className="input" required value={form.name} onChange={set('name')} placeholder="Malbec Reserva" />
        </div>
        <div>
          <label className="label">Código de Barras *</label>
          <input className="input" required value={form.code} onChange={set('code')} placeholder="MAL-MZA-21" />
        </div>
        <div>
          <label className="label">Categoría *</label>
          <select className="input" required value={form.category} onChange={set('category')}>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Bodega</label>
          <input className="input" value={form.winery} onChange={set('winery')} placeholder="Achaval Ferrer" />
        </div>
        <div>
          <label className="label">Varietal</label>
          <input className="input" value={form.varietal} onChange={set('varietal')} placeholder="Malbec" />
        </div>
        <div>
          <label className="label">Región</label>
          <input className="input" value={form.region} onChange={set('region')} placeholder="Mendoza" />
        </div>
        <div>
          <label className="label">Cosecha</label>
          <input className="input" type="number" min="1900" max="2099" value={form.vintage} onChange={set('vintage')} placeholder="2021" />
        </div>
        <div>
          <label className="label">Stock (botellas) *</label>
          <input className="input" type="number" min="0" required value={form.stock} onChange={set('stock')} placeholder="24" />
        </div>
        <div>
          <label className="label">Botellas por Caja *</label>
          <input className="input" type="number" min="1" required value={form.bottlesPerCase} onChange={set('bottlesPerCase')} placeholder="6" />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Precios</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Botella Suelta *</label>
            <input className="input" type="text" inputMode="decimal" required value={form.priceBottle} onChange={set('priceBottle')} placeholder="3500" />
          </div>
          <div>
            <label className="label">Caja Entera *</label>
            <input className="input" type="text" inputMode="decimal" required value={form.priceCase} onChange={set('priceCase')} placeholder="18000" />
          </div>
          <div>
            <label className="label">Mercado / Rest.</label>
            <input className="input" type="text" inputMode="decimal" value={form.priceMarket} onChange={set('priceMarket')} placeholder="5200" />
          </div>
        </div>
      </div>

      <div>
        <label className="label">Notas</label>
        <textarea className="input resize-none" rows={2} value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Observaciones opcionales..." />
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" className="btn-primary">{submitLabel}</button>
      </div>
    </form>
  );
}

function wineToForm(wine: Wine): FormState {
  return {
    name: wine.name, code: wine.code, category: wine.category,
    vintage: wine.vintage ? String(wine.vintage) : '',
    region: wine.region ?? '', winery: wine.winery ?? '', varietal: wine.varietal ?? '',
    stock: String(wine.stock), bottlesPerCase: String(wine.bottlesPerCase),
    priceBottle: String(wine.prices.bottle), priceCase: String(wine.prices.case),
    priceMarket: String(wine.prices.market), notes: wine.notes ?? '',
  };
}

function parsePrice(v: string): number {
  return parseFloat(v.replace(',', '.')) || 0;
}

function formToWineData(form: FormState): Omit<Wine, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: form.name.trim(), code: form.code.trim().toUpperCase(), category: form.category,
    vintage: form.vintage ? Number(form.vintage) : undefined,
    region: form.region.trim() || undefined, winery: form.winery.trim() || undefined,
    varietal: form.varietal.trim() || undefined,
    stock: Number(form.stock), bottlesPerCase: Number(form.bottlesPerCase),
    prices: {
      bottle: parsePrice(form.priceBottle),
      case: parsePrice(form.priceCase),
      market: parsePrice(form.priceMarket),
    },
    notes: form.notes.trim() || undefined,
  };
}

export function StockPage() {
  const wines = useWineStore((s) => s.wines);
  const addWine = useWineStore((s) => s.addWine);
  const updateWine = useWineStore((s) => s.updateWine);
  const deleteWine = useWineStore((s) => s.deleteWine);
  const updateStock = useWineStore((s) => s.updateStock);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [addOpen, setAddOpen] = useState(false);
  const [editWine, setEditWine] = useState<Wine | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [barcodeWine, setBarcodeWine] = useState<Wine | null>(null);
  const [importData, setImportData] = useState<{ valid: ImportedWine[]; errors: string[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return wines.filter((w) => {
      const matchCat = categoryFilter === 'all' || w.category === categoryFilter;
      const matchSearch = !q || w.name.toLowerCase().includes(q) || w.code.toLowerCase().includes(q) ||
        (w.winery ?? '').toLowerCase().includes(q) || (w.varietal ?? '').toLowerCase().includes(q) ||
        (w.region ?? '').toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [wines, search, categoryFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'category') cmp = a.category.localeCompare(b.category);
      else if (sortField === 'stock') cmp = a.stock - b.stock;
      else if (sortField === 'price') cmp = a.prices.bottle - b.prices.bottle;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  const totalBottles = sorted.reduce((acc, w) => acc + w.stock, 0);
  const totalValue = sorted.reduce((acc, w) => acc + w.stock * w.prices.bottle, 0);
  const categories = useCategoryStore((s) => s.categories);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const result = await importWinesFromExcel(file);
    setImportData(result);
  }

  async function handleConfirmImport() {
    if (!importData) return;
    setImporting(true);
    for (const w of importData.valid) {
      await addWine(w);
    }
    setImporting(false);
    setImportData(null);
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp size={12} className="text-gray-300 ml-1 inline" />;
    return sortDir === 'asc' ? <ChevronUp size={12} className="text-burgundy ml-1 inline" /> : <ChevronDown size={12} className="text-burgundy ml-1 inline" />;
  };

  const th = (label: string, field: SortField) => (
    <th className="table-header cursor-pointer select-none hover:bg-gray-100 transition-colors whitespace-nowrap" onClick={() => handleSort(field)}>
      {label}<SortIcon field={field} />
    </th>
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock / Inventario</h1>
          <p className="text-sm text-gray-500 mt-0.5">{wines.length} vinos registrados</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => downloadWineTemplate()} className="btn-ghost">
            <FileSpreadsheet size={15} />
            Plantilla
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="btn-secondary">
            <Upload size={15} />
            Importar Excel
          </button>
          <button onClick={() => exportStockToExcel(wines)} className="btn-secondary">
            <Download size={15} />
            Exportar Excel
          </button>
          <button onClick={() => setAddOpen(true)} className="btn-primary">
            <Plus size={15} />
            Agregar Vino
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nombre, código, bodega..." />
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${categoryFilter === 'all' ? 'bg-burgundy text-white border-burgundy' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
            Todos
          </button>
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${categoryFilter === cat.id ? 'bg-burgundy text-white border-burgundy' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        {sorted.length === 0 ? (
          <EmptyState icon={Package} title="Sin vinos"
            description={search || categoryFilter !== 'all' ? 'No hay vinos que coincidan con la búsqueda.' : 'Agregá el primer vino al inventario.'}
            action={!search && categoryFilter === 'all' ? <button onClick={() => setAddOpen(true)} className="btn-primary"><Plus size={15} />Agregar Vino</button> : undefined}
          />
        ) : (
          <>
            <div className="overflow-auto max-h-[calc(100vh-320px)]">
              <table className="w-full min-w-[1100px]">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className="table-header w-10">#</th>
                    <th className="table-header">Cód. Barras</th>
                    {th('Nombre', 'name')}
                    {th('Categoría', 'category')}
                    <th className="table-header">Bodega</th>
                    <th className="table-header">Varietal</th>
                    <th className="table-header">Cosecha</th>
                    {th('Stock', 'stock')}
                    <th className="table-header text-center">Bot/Caja</th>
                    {th('P. Botella', 'price')}
                    <th className="table-header">P. Caja</th>
                    <th className="table-header">P. Merc.</th>
                    <th className="table-header text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((wine, idx) => (
                    <tr key={wine.id} className={`group transition-colors ${wine.stock <= 6 ? 'bg-red-50/60 hover:bg-red-50' : 'hover:bg-cream/50'}`}>
                      <td className="table-cell text-xs text-gray-400 text-center">{idx + 1}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1.5">
                          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono whitespace-nowrap">{wine.code}</code>
                          <button onClick={() => setBarcodeWine(wine)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-200 text-gray-500"
                            title="Ver código de barras">
                            <Barcode size={13} />
                          </button>
                        </div>
                      </td>
                      <td className="table-cell font-medium text-gray-800 whitespace-nowrap">{wine.name}</td>
                      <td className="table-cell"><CategoryBadge category={wine.category} /></td>
                      <td className="table-cell text-gray-600 whitespace-nowrap">{wine.winery ?? '—'}</td>
                      <td className="table-cell text-gray-600 whitespace-nowrap">{wine.varietal ?? '—'}</td>
                      <td className="table-cell text-gray-600">{wine.vintage ?? '—'}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => updateStock(wine.id, -1)} disabled={wine.stock === 0}
                            className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold text-sm">−</button>
                          <span className={`w-8 text-center text-sm font-bold ${wine.stock <= 6 ? 'text-red-600' : 'text-gray-800'}`}>{wine.stock}</span>
                          <button onClick={() => updateStock(wine.id, 1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors font-bold text-sm">+</button>
                        </div>
                      </td>
                      <td className="table-cell text-center text-gray-600">{wine.bottlesPerCase}</td>
                      <td className="table-cell font-medium text-gray-800 whitespace-nowrap">{formatCurrency(wine.prices.bottle)}</td>
                      <td className="table-cell text-gray-600 whitespace-nowrap">{formatCurrency(wine.prices.case)}</td>
                      <td className="table-cell text-gray-600 whitespace-nowrap">{formatCurrency(wine.prices.market)}</td>
                      <td className="table-cell">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setEditWine(wine)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="Editar"><Edit2 size={14} /></button>
                          <button onClick={() => setDeleteId(wine.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors" title="Eliminar"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/60 rounded-b-xl text-xs text-gray-500">
              <span>Mostrando <span className="font-semibold text-gray-700">{sorted.length}</span> de <span className="font-semibold text-gray-700">{wines.length}</span> vinos</span>
              <div className="flex gap-4">
                <span>Total botellas: <span className="font-semibold text-gray-700">{totalBottles.toLocaleString('es-AR')}</span></span>
                <span>Valor total: <span className="font-semibold text-gray-700">{formatCurrency(totalValue)}</span></span>
              </div>
            </div>
          </>
        )}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Agregar Vino" size="lg">
        <WineForm initial={EMPTY_FORM} onSubmit={(f) => { addWine(formToWineData(f)); setAddOpen(false); }} onCancel={() => setAddOpen(false)} submitLabel="Agregar Vino" />
      </Modal>

      <Modal open={editWine !== null} onClose={() => setEditWine(null)} title="Editar Vino" size="lg">
        {editWine && (
          <WineForm initial={wineToForm(editWine)}
            onSubmit={(f) => { const d = formToWineData(f); updateWine(editWine.id, d); setEditWine(null); }}
            onCancel={() => setEditWine(null)} submitLabel="Guardar Cambios" />
        )}
      </Modal>

      <ConfirmDialog open={deleteId !== null} onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteWine(deleteId); setDeleteId(null); }}
        title="Eliminar Vino" message="¿Estás seguro de que querés eliminar este vino? Esta acción no se puede deshacer." confirmLabel="Eliminar" danger />

      {/* Barcode modal */}
      <Modal open={barcodeWine !== null} onClose={() => setBarcodeWine(null)} title={`Código de Barras — ${barcodeWine?.code ?? ''}`} size="sm">
        {barcodeWine && (
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-white border border-gray-200 rounded-xl w-full flex justify-center">
              <ReactBarcode value={barcodeWine.code} format="CODE128" width={2} height={80} fontSize={14} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-800">{barcodeWine.name}</p>
              <code className="text-sm text-gray-500 font-mono">{barcodeWine.code}</code>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setBarcodeWine(null)} className="btn-secondary">Cerrar</button>
              <button onClick={() => window.print()} className="btn-primary">Imprimir</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!importData} onClose={() => setImportData(null)} title="Importar Vinos desde Excel" size="lg">
        {importData && (
          <div className="space-y-4">
            {importData.valid.length > 0 && (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm">
                <CheckCircle size={16} />
                {importData.valid.length} vino{importData.valid.length !== 1 ? 's' : ''} listos para importar
              </div>
            )}
            {importData.errors.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-amber-700 font-medium text-sm mb-2">
                  <AlertTriangle size={15} />
                  {importData.errors.length} fila{importData.errors.length !== 1 ? 's' : ''} con errores (se omiten)
                </div>
                <ul className="text-xs text-amber-700 space-y-0.5 pl-2">
                  {importData.errors.map((e, i) => <li key={i}>• {e}</li>)}
                </ul>
              </div>
            )}
            {importData.valid.length > 0 && (
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="table-header text-left">Nombre</th>
                      <th className="table-header">Código</th>
                      <th className="table-header">Stock</th>
                      <th className="table-header">P. Botella</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importData.valid.map((w, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="table-cell font-medium">{w.name}</td>
                        <td className="table-cell text-center"><code className="text-xs bg-gray-100 px-1 rounded">{w.code}</code></td>
                        <td className="table-cell text-center">{w.stock}</td>
                        <td className="table-cell text-center">${w.prices.bottle.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {importData.valid.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No hay vinos válidos para importar.</p>
            )}
            <div className="flex gap-2 justify-end pt-1">
              <button onClick={() => setImportData(null)} className="btn-secondary">Cancelar</button>
              {importData.valid.length > 0 && (
                <button onClick={handleConfirmImport} disabled={importing} className="btn-primary">
                  {importing ? 'Importando...' : `Importar ${importData.valid.length} vino${importData.valid.length !== 1 ? 's' : ''}`}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
