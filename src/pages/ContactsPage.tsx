import { useState } from 'react';
import { Users, Plus, Edit2, Trash2, Search, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useContactStore } from '../store/contactStore';
import { Contact, PRICE_TYPE_SHORT } from '../types';
import { generateId } from '../utils/format';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';

const PRICE_OPTIONS: { value: Contact['defaultPriceType']; label: string }[] = [
  { value: 'bottle', label: 'Botella Suelta' },
  { value: 'case',   label: 'Caja Entera' },
  { value: 'market', label: 'Mercado / Rest.' },
];

const PRICE_COLORS: Record<Contact['defaultPriceType'], string> = {
  bottle: 'bg-amber-100 text-amber-800 border-amber-200',
  case:   'bg-blue-100 text-blue-700 border-blue-200',
  market: 'bg-purple-100 text-purple-700 border-purple-200',
};

interface ContactFormData {
  name: string;
  company: string;
  phone: string;
  address: string;
  email: string;
  cuit: string;
  defaultPriceType: Contact['defaultPriceType'];
  notes: string;
}

const EMPTY_FORM: ContactFormData = {
  name: '', company: '', phone: '', address: '',
  email: '', cuit: '', defaultPriceType: 'bottle', notes: '',
};

function contactToForm(c: Contact): ContactFormData {
  return {
    name: c.name,
    company: c.company ?? '',
    phone: c.phone ?? '',
    address: c.address ?? '',
    email: c.email ?? '',
    cuit: c.cuit ?? '',
    defaultPriceType: c.defaultPriceType,
    notes: c.notes ?? '',
  };
}

export function ContactsPage() {
  const { contacts, addContact, updateContact, deleteContact } = useContactStore();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ContactFormData>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  const filtered = contacts.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.company ?? '').toLowerCase().includes(q) ||
      (c.phone ?? '').includes(q) ||
      (c.email ?? '').toLowerCase().includes(q)
    );
  });

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(contact: Contact) {
    setEditingId(contact.id);
    setForm(contactToForm(contact));
    setFormError('');
    setModalOpen(true);
  }

  function setField<K extends keyof ContactFormData>(key: K, value: ContactFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    if (!form.name.trim()) { setFormError('El nombre es requerido.'); return; }
    setFormError('');
    const data = {
      name: form.name.trim(),
      ...(form.company.trim() ? { company: form.company.trim() } : {}),
      ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      ...(form.address.trim() ? { address: form.address.trim() } : {}),
      ...(form.email.trim() ? { email: form.email.trim() } : {}),
      ...(form.cuit.trim() ? { cuit: form.cuit.trim() } : {}),
      defaultPriceType: form.defaultPriceType,
      ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
    };
    if (editingId) {
      updateContact(editingId, data);
    } else {
      addContact(data);
    }
    setModalOpen(false);
  }

  const deleteTarget = contacts.find((c) => c.id === deleteId);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contactos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{contacts.length} contacto{contacts.length !== 1 ? 's' : ''} guardado{contacts.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={16} />
          Nuevo Contacto
        </button>
      </div>

      <div className="relative w-64">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar contacto..."
          className="input pl-9 pr-8"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search ? 'Sin resultados' : 'Sin contactos aún'}
            description={search ? 'Probá con otro término de búsqueda.' : 'Guardá tus clientes para cargar pedidos más rápido.'}
            action={!search ? <button onClick={openAdd} className="btn-primary"><Plus size={16} />Agregar contacto</button> : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header text-left">Nombre / Empresa</th>
                  <th className="table-header text-left">Contacto</th>
                  <th className="table-header text-left">CUIT</th>
                  <th className="table-header text-left">Canal de precio</th>
                  <th className="table-header text-left">Notas</th>
                  <th className="table-header text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell">
                      <div className="font-medium text-gray-900">{contact.name}</div>
                      {contact.company && <div className="text-xs text-gray-400">{contact.company}</div>}
                    </td>
                    <td className="table-cell">
                      {contact.phone && <div className="text-sm text-gray-700">{contact.phone}</div>}
                      {contact.email && <div className="text-xs text-gray-400">{contact.email}</div>}
                      {contact.address && <div className="text-xs text-gray-400 truncate max-w-[180px]">{contact.address}</div>}
                    </td>
                    <td className="table-cell">
                      {contact.cuit ? (
                        <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">{contact.cuit}</code>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', PRICE_COLORS[contact.defaultPriceType])}>
                        {PRICE_TYPE_SHORT[contact.defaultPriceType]}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="text-xs text-gray-500 line-clamp-1 max-w-[160px]">{contact.notes || '—'}</span>
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(contact)} className="btn-ghost p-1.5 text-gray-500">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => setDeleteId(contact.id)} className="btn-ghost p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50">
                          <Trash2 size={14} />
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar Contacto' : 'Nuevo Contacto'} size="lg">
        <div className="space-y-4">
          {formError && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Nombre *</label>
              <input type="text" value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Juan García" className="input" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Empresa / Restaurante</label>
              <input type="text" value={form.company} onChange={(e) => setField('company', e.target.value)} placeholder="Restaurante El Viñedo" className="input" />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input type="text" value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="+54 11 1234-5678" className="input" />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} placeholder="mail@ejemplo.com" className="input" />
            </div>
            <div className="col-span-2">
              <label className="label">Dirección</label>
              <input type="text" value={form.address} onChange={(e) => setField('address', e.target.value)} placeholder="Av. Corrientes 1234, CABA" className="input" />
            </div>
            <div>
              <label className="label">CUIT</label>
              <input type="text" value={form.cuit} onChange={(e) => setField('cuit', e.target.value)} placeholder="20-12345678-9" className="input" />
            </div>
            <div>
              <label className="label">Canal de precio por defecto</label>
              <select value={form.defaultPriceType} onChange={(e) => setField('defaultPriceType', e.target.value as Contact['defaultPriceType'])} className="input">
                {PRICE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Notas</label>
              <textarea value={form.notes} onChange={(e) => setField('notes', e.target.value)} placeholder="Observaciones del contacto..." rows={2} className="input resize-none" />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleSave} className="btn-primary">{editingId ? 'Guardar cambios' : 'Crear contacto'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteContact(deleteId); setDeleteId(null); }}
        title="Eliminar contacto"
        message={`¿Eliminar a "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
      />
    </div>
  );
}
