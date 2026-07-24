import { useState, useRef, useEffect } from 'react';
import { PackagePlus, Search, Plus, X, Barcode, CheckCircle, AlertTriangle, History, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { useWineStore } from '../store/wineStore';
import { useReceptionStore } from '../store/receptionStore';
import { useCategoryStore } from '../store/categoryStore';
import { Wine, StockReceptionItem } from '../types';
import { formatCurrency, formatDate, formatDateShort, generateId } from '../utils/format';
import { CategoryBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

// ── Types ────────────────────────────────────────────────────────────────────

interface IntakeItem {
  wine: Wine;
  quantity: number;
  isNew: boolean;
}

interface QuickWineForm {
  name: string; code: string; category: string;
  vintage: string; region: string; winery: string; varietal: string;
  bottlesPerCase: string; priceBottle: string; priceCase: string; priceMarket: string; notes: string;
}

const EMPTY_FORM = (code = ''): QuickWineForm => ({
  name: '', code, category: '', vintage: '', region: '', winery: '',
  varietal: '', bottlesPerCase: '6', priceBottle: '0', priceCase: '0', priceMarket: '0', notes: '',
});

type Tab = 'nueva' | 'historial';

// ── Component ────────────────────────────────────────────────────────────────

export function StockIntakePage() {
  const { wines, addWine, updateStock } = useWineStore();
  const { receptions, addReception, deleteReception } = useReceptionStore();
  const categories = useCategoryStore((s) => s.categories);

  const [tab, setTab] = useState<Tab>('nueva');
  const [scanInput, setScanInput] = useState('');
  const [dropdownWines, setDropdownWines] = useState<Wine[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notFoundCode, setNotFoundCode] = useState('');
  const [intakeItems, setIntakeItems] = useState<IntakeItem[]>([]);
  const [intakeNotes, setIntakeNotes] = useState('');
  const [appliedModal, setAppliedModal] = useState(false);
  const [confirmApply, setConfirmApply] = useState(false);
  const [newWineModal, setNewWineModal] = useState(false);
  const [form, setForm] = useState<QuickWineForm>(EMPTY_FORM());
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof QuickWineForm, string>>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteReceptionId, setDeleteReceptionId] = useState<string | null>(null);

  const scanRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function handleScanChange(value: string) {
    setScanInput(value);
    setNotFoundCode('');
    if (!value.trim()) { setDropdownWines([]); setShowDropdown(false); return; }
    const q = value.toLowerCase();
    const matches = wines.filter(
      (w) => w.code.toLowerCase().includes(q) || w.name.toLowerCase().includes(q) ||
        (w.winery ?? '').toLowerCase().includes(q) || (w.varietal ?? '').toLowerCase().includes(q)
    );
    setDropdownWines(matches);
    setShowDropdown(matches.length > 0);
  }

  function tryAddByInput() {
    const trimmed = scanInput.trim();
    if (!trimmed) return;
    const exact = wines.find((w) => w.code.toLowerCase() === trimmed.toLowerCase());
    if (exact) {
      addToIntake(exact);
      setScanInput('');
      setShowDropdown(false);
      setNotFoundCode('');
      scanRef.current?.focus();
      return;
    }
    setShowDropdown(false);
    setNotFoundCode(trimmed);
  }

  function addToIntake(wine: Wine, isNew = false) {
    setIntakeItems((prev) => {
      const existing = prev.findIndex((i) => i.wine.id === wine.id);
      if (existing >= 0) return prev.map((item, idx) => idx === existing ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { wine, quantity: 1, isNew }];
    });
  }

  function selectFromDropdown(wine: Wine) {
    addToIntake(wine);
    setScanInput(''); setDropdownWines([]); setShowDropdown(false); setNotFoundCode('');
    scanRef.current?.focus();
  }

  function setItemQty(wineId: string, qty: number) {
    setIntakeItems((prev) => prev.map((i) => i.wine.id === wineId ? { ...i, quantity: Math.max(1, qty) } : i));
  }

  function removeItem(wineId: string) {
    setIntakeItems((prev) => prev.filter((i) => i.wine.id !== wineId));
  }

  function openNewWineForm(code: string) {
    setForm(EMPTY_FORM(code)); setFormErrors({}); setNewWineModal(true);
  }

  function setField<K extends keyof QuickWineForm>(k: K, v: QuickWineForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setFormErrors((e) => ({ ...e, [k]: undefined }));
  }

  function validateForm(): boolean {
    const errs: typeof formErrors = {};
    if (!form.name.trim()) errs.name = 'Requerido';
    if (!form.code.trim()) errs.code = 'Requerido';
    if (!form.bottlesPerCase || parseInt(form.bottlesPerCase) < 1) errs.bottlesPerCase = 'Debe ser ≥ 1';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSaveNewWine() {
    if (!validateForm()) return;
    const wine = await addWine({
      name: form.name.trim(), code: form.code.trim(), category: form.category,
      ...(form.vintage ? { vintage: parseInt(form.vintage) } : {}),
      ...(form.region.trim() ? { region: form.region.trim() } : {}),
      ...(form.winery.trim() ? { winery: form.winery.trim() } : {}),
      ...(form.varietal.trim() ? { varietal: form.varietal.trim() } : {}),
      stock: 0, bottlesPerCase: parseInt(form.bottlesPerCase) || 6,
      prices: { bottle: parseFloat(form.priceBottle) || 0, case: parseFloat(form.priceCase) || 0, market: parseFloat(form.priceMarket) || 0 },
      ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
    });
    setNewWineModal(false);
    setScanInput(''); setNotFoundCode('');
    addToIntake(wine, true);
    scanRef.current?.focus();
  }

  async function applyStock() {
    await Promise.all(intakeItems.map((item) => updateStock(item.wine.id, item.quantity)));
    const items: StockReceptionItem[] = intakeItems.map((i) => ({
      wineId: i.wine.id, wineName: i.wine.name, wineCode: i.wine.code,
      quantity: i.quantity, isNew: i.isNew,
    }));
    await addReception(items, intakeNotes.trim() || undefined);

    setIntakeItems([]);
    setScanInput(''); setNotFoundCode(''); setIntakeNotes('');
    setAppliedModal(true);
  }

  const totalBottles = intakeItems.reduce((s, i) => s + i.quantity, 0);
  const newWinesCount = intakeItems.filter((i) => i.isNew).length;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <PackagePlus size={24} className="text-burgundy" />
            Recepción de Mercadería
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Registrá las entradas de stock y consultá el historial.</p>
        </div>
        {tab === 'nueva' && intakeItems.length > 0 && (
          <button onClick={() => setConfirmApply(true)} className="btn-primary">
            <CheckCircle size={16} />
            Aplicar al Stock ({totalBottles} bot.)
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setTab('nueva')}
          className={clsx('px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
            tab === 'nueva' ? 'border-burgundy text-burgundy' : 'border-transparent text-gray-500 hover:text-gray-700')}
        >
          <span className="flex items-center gap-2"><PackagePlus size={15} />Nueva Recepción{intakeItems.length > 0 && <span className="ml-1 bg-burgundy text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{intakeItems.length}</span>}</span>
        </button>
        <button
          onClick={() => setTab('historial')}
          className={clsx('px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
            tab === 'historial' ? 'border-burgundy text-burgundy' : 'border-transparent text-gray-500 hover:text-gray-700')}
        >
          <span className="flex items-center gap-2"><History size={15} />Historial{receptions.length > 0 && <span className="ml-1 text-xs text-gray-400">({receptions.length})</span>}</span>
        </button>
      </div>

      {/* ── TAB: Nueva Recepción ──────────────────────────────────────────── */}
      {tab === 'nueva' && (
        <div className="space-y-4">
          <div className="card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Barcode size={18} className="text-burgundy flex-shrink-0" />
              <h2 className="font-semibold text-gray-800">Escanear o Buscar Vino</h2>
              <span className="text-xs text-gray-400 ml-auto">Enter para añadir por código exacto</span>
            </div>

            <div className="relative" ref={dropdownRef}>
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                ref={scanRef}
                type="text"
                value={scanInput}
                onChange={(e) => handleScanChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') tryAddByInput(); if (e.key === 'Escape') { setShowDropdown(false); setNotFoundCode(''); } }}
                placeholder="Código de barras o nombre del vino..."
                className="input pl-9 pr-10 text-base"
                autoFocus
              />
              {scanInput && (
                <button onClick={() => { setScanInput(''); setShowDropdown(false); setNotFoundCode(''); scanRef.current?.focus(); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={15} />
                </button>
              )}

              {showDropdown && dropdownWines.length > 0 && (
                <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-72 overflow-y-auto">
                  {dropdownWines.map((wine) => (
                    <button key={wine.id} onClick={() => selectFromDropdown(wine)}
                      className="w-full text-left px-4 py-3 hover:bg-cream transition-colors border-b border-gray-50 last:border-0 flex items-center gap-3">
                      <CategoryBadge category={wine.category} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900">{wine.name}</div>
                        <div className="text-xs text-gray-400">{wine.code}{wine.winery ? ` · ${wine.winery}` : ''}</div>
                      </div>
                      <div className="text-right text-xs text-gray-500 flex-shrink-0">
                        <div>Stock: {wine.stock}</div>
                        <div>{formatCurrency(wine.prices.bottle)}/bot.</div>
                      </div>
                      <Plus size={15} className="text-burgundy flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {notFoundCode && (
              <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-800">
                    Código <code className="bg-amber-100 px-1 rounded font-mono">{notFoundCode}</code> no encontrado.
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">¿Querés registrarlo como un vino nuevo?</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setNotFoundCode('')} className="btn-ghost text-xs py-1">Cancelar</button>
                  <button onClick={() => openNewWineForm(notFoundCode)} className="btn-primary text-xs py-1.5">
                    <Plus size={13} />Registrar nuevo
                  </button>
                </div>
              </div>
            )}
          </div>

          {intakeItems.length > 0 ? (
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
                <h2 className="font-semibold text-gray-800">
                  Lista de recepción
                  <span className="ml-2 text-xs font-normal text-gray-500">{intakeItems.length} vino{intakeItems.length !== 1 ? 's' : ''} · {totalBottles} botellas</span>
                </h2>
                {newWinesCount > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
                    {newWinesCount} nuevo{newWinesCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="divide-y divide-gray-50">
                {intakeItems.map((item) => (
                  <div key={item.wine.id} className={clsx('flex items-center gap-4 px-5 py-3.5', item.isNew && 'bg-blue-50/40')}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CategoryBadge category={item.wine.category} />
                        <span className="font-medium text-gray-900">{item.wine.name}</span>
                        <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-500">{item.wine.code}</code>
                        {item.isNew && <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full font-medium">nuevo</span>}
                      </div>
                      {!item.isNew && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          Stock actual: {item.wine.stock} → después: <strong className="text-green-600">{item.wine.stock + item.quantity}</strong>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => item.quantity > 1 ? setItemQty(item.wine.id, item.quantity - 1) : removeItem(item.wine.id)}
                        className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 text-lg leading-none font-medium transition-colors">−</button>
                      <input type="number" min={1} value={item.quantity}
                        onChange={(e) => setItemQty(item.wine.id, parseInt(e.target.value) || 1)}
                        className="input w-16 text-center font-semibold" />
                      <button onClick={() => setItemQty(item.wine.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 text-lg leading-none font-medium transition-colors">+</button>
                      <span className="text-xs text-gray-400 w-10">bot.</span>
                    </div>
                    <button onClick={() => removeItem(item.wine.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="px-5 py-3 border-t border-gray-100 space-y-2">
                <div>
                  <label className="label">Notas de la recepción (opcional)</label>
                  <input type="text" value={intakeNotes} onChange={(e) => setIntakeNotes(e.target.value)}
                    placeholder="Ej: Pedido proveedor #123, estado del embalaje..." className="input" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Total: <strong className="text-gray-900">{totalBottles} botellas</strong></span>
                  <div className="flex gap-2">
                    <button onClick={() => setIntakeItems([])} className="btn-secondary text-sm">Limpiar</button>
                    <button onClick={() => setConfirmApply(true)} className="btn-primary text-sm">
                      <CheckCircle size={15} />Aplicar al Stock
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-cream-dark flex items-center justify-center mb-4">
                <PackagePlus size={28} className="text-burgundy/40" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">Lista vacía</h3>
              <p className="text-sm text-gray-400 max-w-xs">Escaneá el código de barras o buscá los vinos del pedido recibido.</p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Historial ──────────────────────────────────────────────────── */}
      {tab === 'historial' && (
        <div className="space-y-3">
          {receptions.length === 0 ? (
            <div className="card p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-cream-dark flex items-center justify-center mb-4">
                <History size={28} className="text-burgundy/40" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">Sin recepciones registradas</h3>
              <p className="text-sm text-gray-400 max-w-xs">Las recepciones aplicadas al stock aparecerán aquí.</p>
            </div>
          ) : (
            <>
              <div className="text-xs text-gray-400 text-right">{receptions.length} recepción{receptions.length !== 1 ? 'es' : ''} registrada{receptions.length !== 1 ? 's' : ''}</div>
              {receptions.map((rec) => {
                const isExpanded = expandedId === rec.id;
                return (
                  <div key={rec.id} className="card overflow-hidden">
                    <div
                      className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                    >
                      <div className="flex-shrink-0">
                        {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-mono font-semibold text-burgundy text-sm">{rec.receptionNumber}</span>
                          <span className="text-sm font-medium text-gray-800">{rec.items.length} vino{rec.items.length !== 1 ? 's' : ''}</span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{rec.totalBottles} botellas</span>
                          {rec.newWinesCount > 0 && (
                            <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">{rec.newWinesCount} nuevo{rec.newWinesCount !== 1 ? 's' : ''}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                          <span>{formatDate(rec.createdAt)}</span>
                          {rec.notes && <span className="truncate max-w-[300px]">· {rec.notes}</span>}
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteReceptionId(rec.id); }}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-100">
                        <table className="w-full">
                          <thead>
                            <tr>
                              <th className="table-header text-left">Vino</th>
                              <th className="table-header text-left">Código de Barras</th>
                              <th className="table-header text-center">Botellas recibidas</th>
                              <th className="table-header text-center">Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rec.items.map((item) => (
                              <tr key={item.wineId} className="hover:bg-gray-50">
                                <td className="table-cell font-medium text-gray-800">{item.wineName}</td>
                                <td className="table-cell">
                                  <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">{item.wineCode}</code>
                                </td>
                                <td className="table-cell text-center font-semibold text-gray-700">{item.quantity}</td>
                                <td className="table-cell text-center">
                                  {item.isNew ? (
                                    <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">registrado nuevo</span>
                                  ) : (
                                    <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">stock sumado</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* ── New wine modal ───────────────────────────────────────────────────── */}
      <Modal open={newWineModal} onClose={() => setNewWineModal(false)} title="Registrar Nuevo Vino" size="lg">
        <div className="space-y-4">
          <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 px-3 py-2 rounded-lg">
            Completá los datos del vino. Los precios se pueden actualizar después desde Precios.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Nombre *</label>
              <input type="text" value={form.name} onChange={(e) => setField('name', e.target.value)}
                placeholder="Ej: Malbec Reserva" className={clsx('input', formErrors.name && 'border-red-400')} />
              {formErrors.name && <p className="text-xs text-red-500 mt-0.5">{formErrors.name}</p>}
            </div>
            <div>
              <label className="label">Código de Barras *</label>
              <input type="text" value={form.code} onChange={(e) => setField('code', e.target.value)}
                placeholder="Ej: MAL-RES-21" className={clsx('input', formErrors.code && 'border-red-400')} />
              {formErrors.code && <p className="text-xs text-red-500 mt-0.5">{formErrors.code}</p>}
            </div>
            <div>
              <label className="label">Categoría</label>
              <select value={form.category || categories[0]?.id || ''} onChange={(e) => setField('category', e.target.value)} className="input">
                {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Cosecha</label>
              <input type="number" value={form.vintage} onChange={(e) => setField('vintage', e.target.value)} placeholder="2022" min={1900} max={2099} className="input" />
            </div>
            <div>
              <label className="label">Bodega / Productor</label>
              <input type="text" value={form.winery} onChange={(e) => setField('winery', e.target.value)} placeholder="Achaval Ferrer" className="input" />
            </div>
            <div>
              <label className="label">Varietal</label>
              <input type="text" value={form.varietal} onChange={(e) => setField('varietal', e.target.value)} placeholder="Malbec" className="input" />
            </div>
            <div>
              <label className="label">Región</label>
              <input type="text" value={form.region} onChange={(e) => setField('region', e.target.value)} placeholder="Mendoza" className="input" />
            </div>
            <div>
              <label className="label">Botellas por caja *</label>
              <input type="number" value={form.bottlesPerCase} onChange={(e) => setField('bottlesPerCase', e.target.value)} min={1} max={24}
                className={clsx('input', formErrors.bottlesPerCase && 'border-red-400')} />
              {formErrors.bottlesPerCase && <p className="text-xs text-red-500 mt-0.5">{formErrors.bottlesPerCase}</p>}
            </div>
          </div>
          <div>
            <p className="label mb-2">Precios (ARS) — editables después</p>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs text-gray-500 mb-1 block">Botella Suelta</label><input type="number" value={form.priceBottle} onChange={(e) => setField('priceBottle', e.target.value)} min={0} className="input" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Caja Entera</label><input type="number" value={form.priceCase} onChange={(e) => setField('priceCase', e.target.value)} min={0} className="input" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Mercado / Rest.</label><input type="number" value={form.priceMarket} onChange={(e) => setField('priceMarket', e.target.value)} min={0} className="input" /></div>
            </div>
          </div>
          <div>
            <label className="label">Notas</label>
            <textarea value={form.notes} onChange={(e) => setField('notes', e.target.value)} placeholder="Observaciones opcionales..." rows={2} className="input resize-none" />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button onClick={() => setNewWineModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleSaveNewWine} className="btn-primary"><Plus size={15} />Registrar y agregar</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={confirmApply} onClose={() => setConfirmApply(false)} onConfirm={applyStock}
        title="Aplicar recepción al stock"
        message={`Vas a sumar ${totalBottles} botellas en ${intakeItems.length} vino${intakeItems.length !== 1 ? 's' : ''} al inventario. La recepción quedará guardada en el historial.`}
        confirmLabel="Aplicar al stock" />

      <ConfirmDialog open={deleteReceptionId !== null} onClose={() => setDeleteReceptionId(null)}
        onConfirm={() => { if (deleteReceptionId) deleteReception(deleteReceptionId); setDeleteReceptionId(null); }}
        title="Eliminar recepción del historial"
        message="¿Eliminar este registro del historial? Esto no revierte los cambios de stock realizados."
        confirmLabel="Eliminar registro" danger />

      <Modal open={appliedModal} onClose={() => setAppliedModal(false)} title="Stock actualizado" size="sm">
        <div className="text-center py-4 space-y-3">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle size={28} className="text-green-600" />
          </div>
          <p className="text-base font-semibold text-gray-800">¡Recepción aplicada!</p>
          <p className="text-sm text-gray-500">El stock fue actualizado y la recepción quedó guardada en el historial.</p>
          <div className="flex gap-2 justify-center mt-2">
            <button onClick={() => setAppliedModal(false)} className="btn-secondary">Nueva recepción</button>
            <button onClick={() => { setAppliedModal(false); setTab('historial'); }} className="btn-primary">Ver historial</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
