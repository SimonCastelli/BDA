import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, ShoppingCart, Users, Search, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { useWineStore } from '../store/wineStore';
import { useOrderStore } from '../store/orderStore';
import { useContactStore } from '../store/contactStore';
import { useCategoryStore } from '../store/categoryStore';
import {
  Client, OrderItem, OrderStatus, OrderUnit, PriceType,
  PRICE_TYPE_LABELS, PRICE_TYPE_SHORT, Contact,
} from '../types';
import { formatCurrency, generateId } from '../utils/format';
import { CategoryBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

interface WineRowState {
  quantity: number;
  unit: OrderUnit;
  priceType: PriceType;
}

const PRICE_CHANNELS: { value: 'bottle' | 'case' | 'market'; label: string; desc: string }[] = [
  { value: 'bottle', label: 'Botella Suelta', desc: 'Venta individual' },
  { value: 'case',   label: 'Caja Entera',   desc: 'Venta por caja' },
  { value: 'market', label: 'Mercado / Rest.', desc: 'Para restaurantes o mayoristas' },
];

const PRICE_CHANNEL_COLORS: Record<'bottle' | 'case' | 'market', string> = {
  bottle: 'border-amber-400 bg-amber-50 text-amber-900',
  case:   'border-blue-400 bg-blue-50 text-blue-900',
  market: 'border-purple-400 bg-purple-50 text-purple-900',
};
const PRICE_CHANNEL_ACTIVE: Record<'bottle' | 'case' | 'market', string> = {
  bottle: 'bg-amber-500 text-white border-amber-500',
  case:   'bg-blue-600 text-white border-blue-600',
  market: 'bg-purple-600 text-white border-purple-600',
};

export function NewOrderPage() {
  const navigate = useNavigate();
  const { wines } = useWineStore();
  const { addOrder } = useOrderStore();
  const { contacts } = useContactStore();
  const getLabel = useCategoryStore((s) => s.getLabel);

  const [search, setSearch] = useState('');
  const [wineRows, setWineRows] = useState<Record<string, WineRowState>>({});
  const [items, setItems] = useState<OrderItem[]>([]);
  const [defaultPriceType, setDefaultPriceType] = useState<'bottle' | 'case' | 'market'>('bottle');
  const [client, setClient] = useState<Client>({ name: '', phone: '', address: '', email: '', cuit: '' });
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [status, setStatus] = useState<OrderStatus>('confirmed');
  const [errors, setErrors] = useState<{ client?: string; items?: string }>({});

  const [contactModal, setContactModal] = useState(false);
  const [contactSearch, setContactSearch] = useState('');

  const filteredWines = wines.filter((w) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      w.name.toLowerCase().includes(q) ||
      w.code.toLowerCase().includes(q) ||
      (w.varietal ?? '').toLowerCase().includes(q) ||
      (w.winery ?? '').toLowerCase().includes(q) ||
      getLabel(w.category).toLowerCase().includes(q)
    );
  });

  const filteredContacts = contacts.filter((c) => {
    if (!contactSearch) return true;
    const q = contactSearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.company ?? '').toLowerCase().includes(q) ||
      (c.phone ?? '').includes(q)
    );
  });

  function getRow(wineId: string): WineRowState {
    return wineRows[wineId] ?? { quantity: 1, unit: 'bottle', priceType: defaultPriceType };
  }

  function setRow(wineId: string, patch: Partial<WineRowState>) {
    setWineRows((prev) => ({ ...prev, [wineId]: { ...getRow(wineId), ...patch } }));
  }

  function handlePriceTypeChange(pt: 'bottle' | 'case' | 'market') {
    setDefaultPriceType(pt);
    setWineRows((prev) => {
      const updated: Record<string, WineRowState> = {};
      for (const [id, row] of Object.entries(prev)) {
        updated[id] = { ...row, priceType: pt };
      }
      return updated;
    });
  }

  function selectContact(contact: Contact) {
    setClient({
      name: contact.name,
      phone: contact.phone ?? '',
      address: contact.address ?? '',
      email: contact.email ?? '',
      cuit: contact.cuit ?? '',
    });
    handlePriceTypeChange(contact.defaultPriceType);
    setContactModal(false);
    setContactSearch('');
  }

  function addItem(wineId: string) {
    const wine = wines.find((w) => w.id === wineId);
    if (!wine) return;
    const row = getRow(wineId);
    const { quantity, unit, priceType } = row;
    if (quantity <= 0) return;

    const unitPrice =
      unit === 'case'
        ? wine.prices.case
        : priceType === 'market'
        ? wine.prices.market
        : priceType === 'case'
        ? wine.prices.case
        : wine.prices.bottle;

    const subtotal = quantity * unitPrice;

    setItems((prev) => {
      const existing = prev.findIndex(
        (i) => i.wineId === wineId && i.unit === unit && i.priceType === (unit === 'case' ? 'case' : priceType)
      );
      if (existing >= 0) {
        return prev.map((item, idx) =>
          idx === existing
            ? { ...item, quantity: item.quantity + quantity, subtotal: (item.quantity + quantity) * item.unitPrice }
            : item
        );
      }
      const newItem: OrderItem = {
        id: generateId(),
        wineId: wine.id,
        wineName: wine.name,
        wineCode: wine.code,
        quantity,
        unit,
        priceType: unit === 'case' ? 'case' : priceType,
        unitPrice,
        subtotal,
      };
      return [...prev, newItem];
    });
  }

  function removeItem(itemId: string) {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }

  const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
  const discountAmount = subtotal * (discount / 100);
  const total = subtotal - discountAmount;

  async function handleSave() {
    const newErrors: typeof errors = {};
    if (!client.name.trim()) newErrors.client = 'El nombre del cliente es requerido.';
    if (items.length === 0) newErrors.items = 'Agregá al menos un producto.';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});

    const cleanClient: Client = {
      name: client.name.trim(),
      ...(client.phone?.trim() ? { phone: client.phone.trim() } : {}),
      ...(client.address?.trim() ? { address: client.address.trim() } : {}),
      ...(client.email?.trim() ? { email: client.email.trim() } : {}),
      ...(client.cuit?.trim() ? { cuit: client.cuit.trim() } : {}),
    };

    const order = await addOrder({
      client: cleanClient,
      items,
      subtotal,
      discount,
      total,
      status,
      ...(paymentMethod.trim() ? { paymentMethod: paymentMethod.trim() } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
      ...(deliveryDate ? { deliveryDate } : {}),
    });

    navigate(`/pedidos/${order.id}`);
  }

  const activePriceChannel = PRICE_CHANNELS.find((p) => p.value === defaultPriceType)!;

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/pedidos')} className="btn-ghost">
          <ArrowLeft size={16} />
          Volver
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Pedido</h1>
      </div>

      <div className="flex gap-6 items-start">
        {/* Left: wine selection */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">Agregar Vinos</h2>
            </div>

            {/* Default price channel selector */}
            <div>
              <p className="label mb-2">Canal de precio por defecto</p>
              <div className="flex gap-2">
                {PRICE_CHANNELS.map((ch) => (
                  <button
                    key={ch.value}
                    onClick={() => handlePriceTypeChange(ch.value)}
                    className={clsx(
                      'flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all text-left',
                      defaultPriceType === ch.value
                        ? PRICE_CHANNEL_ACTIVE[ch.value]
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    <div className="font-semibold">{ch.label}</div>
                    <div className={clsx('text-xs mt-0.5', defaultPriceType === ch.value ? 'opacity-80' : 'text-gray-400')}>{ch.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar vino por nombre, código, varietal, categoría..."
              className="input"
            />
            {errors.items && <p className="text-xs text-red-500">{errors.items}</p>}

            <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
              {filteredWines.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Sin resultados</p>
              ) : (
                filteredWines.map((wine) => {
                  const row = getRow(wine.id);
                  const isCase = row.unit === 'case';
                  const effectivePriceType: PriceType = isCase ? 'case' : row.priceType;
                  const unitPrice =
                    effectivePriceType === 'market' ? wine.prices.market
                    : effectivePriceType === 'case' ? wine.prices.case
                    : wine.prices.bottle;

                  return (
                    <div key={wine.id} className="flex flex-wrap items-center gap-2 p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-cream transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CategoryBadge category={wine.category} />
                          <span className="font-medium text-sm text-gray-900 truncate">{wine.name}</span>
                          <span className="text-xs text-gray-400">{wine.code}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                          <span>Stock: <strong>{wine.stock}</strong></span>
                          <span>Botella: {formatCurrency(wine.prices.bottle)}</span>
                          <span>Caja: {formatCurrency(wine.prices.case)}</span>
                          <span>Mdo: {formatCurrency(wine.prices.market)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <input
                          type="number"
                          min={1}
                          value={row.quantity}
                          onChange={(e) => setRow(wine.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="input w-16 text-center"
                        />
                        <select
                          value={row.unit}
                          onChange={(e) => setRow(wine.id, { unit: e.target.value as OrderUnit })}
                          className="input w-24 pr-1"
                        >
                          <option value="bottle">Botella</option>
                          <option value="case">Caja</option>
                        </select>
                        <select
                          value={isCase ? 'case' : row.priceType}
                          onChange={(e) => setRow(wine.id, { priceType: e.target.value as PriceType })}
                          className="input w-32 pr-1"
                          disabled={isCase}
                        >
                          <option value="bottle">Botella Suelta</option>
                          <option value="case">Caja Entera</option>
                          <option value="market">Mercado/Rest.</option>
                        </select>
                        <div className="text-right min-w-[70px]">
                          <div className="text-xs text-gray-400">por unidad</div>
                          <div className="text-sm font-semibold text-gray-800">{formatCurrency(unitPrice)}</div>
                        </div>
                        <button onClick={() => addItem(wine.id)} className="btn-primary py-1.5">
                          <Plus size={14} />
                          Agregar
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right: order summary */}
        <div className="w-[440px] flex-shrink-0 space-y-4">
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">Resumen del Pedido</h2>
              <button onClick={() => { setContactModal(true); setContactSearch(''); }} className="btn-ghost text-xs gap-1.5 text-burgundy hover:text-burgundy-dark">
                <Users size={14} />
                Seleccionar contacto
              </button>
            </div>

            {/* Active price channel indicator */}
            <div className={clsx('flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium', PRICE_CHANNEL_COLORS[defaultPriceType])}>
              <Check size={13} />
              Canal activo: <strong>{activePriceChannel.label}</strong> — {activePriceChannel.desc}
            </div>

            <div>
              <p className="label">Cliente *</p>
              {errors.client && <p className="text-xs text-red-500 mb-1">{errors.client}</p>}
              <input
                type="text"
                value={client.name}
                onChange={(e) => setClient((c) => ({ ...c, name: e.target.value }))}
                placeholder="Nombre del cliente"
                className={clsx('input', errors.client && 'border-red-400 focus:border-red-400 focus:ring-red-200')}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="label">Teléfono</p>
                <input type="text" value={client.phone} onChange={(e) => setClient((c) => ({ ...c, phone: e.target.value }))} placeholder="+54 11..." className="input" />
              </div>
              <div>
                <p className="label">Email</p>
                <input type="email" value={client.email} onChange={(e) => setClient((c) => ({ ...c, email: e.target.value }))} placeholder="mail@ejemplo.com" className="input" />
              </div>
            </div>
            <div>
              <p className="label">Dirección</p>
              <input type="text" value={client.address} onChange={(e) => setClient((c) => ({ ...c, address: e.target.value }))} placeholder="Calle 123, Ciudad" className="input" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="label">CUIT</p>
                <input type="text" value={client.cuit} onChange={(e) => setClient((c) => ({ ...c, cuit: e.target.value }))} placeholder="20-12345678-9" className="input" />
              </div>
              <div>
                <p className="label">Fecha de entrega</p>
                <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="label">Forma de pago</p>
                <input type="text" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} placeholder="Efectivo, transferencia..." className="input" />
              </div>
              <div>
                <p className="label">Estado</p>
                <select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)} className="input">
                  <option value="draft">Borrador</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="delivered">Entregado</option>
                </select>
              </div>
            </div>
            <div>
              <p className="label">Notas</p>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observaciones del pedido..." rows={2} className="input resize-none" />
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Productos</h3>
              {items.length > 0 && <span className="text-xs text-gray-400">{items.length} ítem{items.length !== 1 ? 's' : ''}</span>}
            </div>
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ShoppingCart size={28} className="text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">No hay productos agregados</p>
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.wineName}</p>
                      <p className="text-xs text-gray-400">
                        {item.quantity} {item.unit === 'bottle' ? 'bot.' : 'caja(s)'} · {PRICE_TYPE_SHORT[item.priceType]} · {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-semibold text-gray-700">{formatCurrency(item.subtotal)}</span>
                      <button onClick={() => removeItem(item.id)} className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-gray-100 pt-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Descuento</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={discount}
                      onChange={(e) => setDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                      className="input w-14 text-center py-0.5 text-xs"
                    />
                    <span className="text-gray-400 text-xs">%</span>
                  </div>
                </div>
                {discount > 0 && <span className="text-green-600 font-medium">-{formatCurrency(discountAmount)}</span>}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="font-bold text-gray-900">TOTAL</span>
                <span className="text-xl font-bold text-burgundy">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => navigate('/pedidos')} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleSave} className="btn-primary flex-1">Guardar Pedido</button>
            </div>
          </div>
        </div>
      </div>

      {/* Contact selector modal */}
      <Modal open={contactModal} onClose={() => setContactModal(false)} title="Seleccionar Contacto" size="md">
        <div className="space-y-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              placeholder="Buscar por nombre, empresa o teléfono..."
              className="input pl-9"
              autoFocus
            />
          </div>

          {filteredContacts.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">
              {contacts.length === 0
                ? 'No tenés contactos guardados aún. Agregá uno desde la sección Contactos.'
                : 'Sin resultados para esa búsqueda.'}
            </div>
          ) : (
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => selectContact(contact)}
                  className="w-full text-left px-3 py-2.5 rounded-lg border border-gray-100 hover:border-burgundy/40 hover:bg-cream transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900 text-sm">{contact.name}</span>
                      {contact.company && <span className="ml-2 text-xs text-gray-400">{contact.company}</span>}
                    </div>
                    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                      contact.defaultPriceType === 'bottle' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                      contact.defaultPriceType === 'case'   ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-purple-50 text-purple-700 border-purple-200'
                    )}>
                      {PRICE_TYPE_SHORT[contact.defaultPriceType]}
                    </span>
                  </div>
                  <div className="flex gap-3 mt-0.5 text-xs text-gray-400">
                    {contact.phone && <span>{contact.phone}</span>}
                    {contact.email && <span>{contact.email}</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
