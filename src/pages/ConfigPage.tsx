import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useCategoryStore } from '../store/categoryStore';
import { useWineStore } from '../store/wineStore';
import { COLOR_OPTIONS, Category } from '../types';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {COLOR_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          title={opt.label}
          onClick={() => onChange(opt.value)}
          className={clsx(
            'px-3 py-1 rounded-full text-xs font-medium border transition-all',
            opt.value,
            value === opt.value ? 'ring-2 ring-offset-1 ring-burgundy scale-110' : 'opacity-70 hover:opacity-100'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

interface EditRowProps {
  cat: Category;
  onSave: (label: string, color: string) => void;
  onCancel: () => void;
}

function EditRow({ cat, onSave, onCancel }: EditRowProps) {
  const [label, setLabel] = useState(cat.label);
  const [color, setColor] = useState(cat.color);

  return (
    <div className="p-4 bg-cream/60 rounded-lg border border-gold/30 space-y-3">
      <div>
        <label className="label">Nombre</label>
        <input
          className="input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter') onSave(label, color); if (e.key === 'Escape') onCancel(); }}
        />
      </div>
      <div>
        <label className="label">Color</label>
        <ColorPicker value={color} onChange={setColor} />
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave(label, color)} disabled={!label.trim()} className="btn-primary">
          <Check size={14} /> Guardar
        </button>
        <button onClick={onCancel} className="btn-secondary">
          <X size={14} /> Cancelar
        </button>
      </div>
    </div>
  );
}

export function ConfigPage() {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategoryStore();
  const wines = useWineStore((s) => s.wines);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0].value);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function winesInCategory(id: string) {
    return wines.filter((w) => w.category === id).length;
  }

  async function handleAdd() {
    if (!newLabel.trim()) return;
    await addCategory({ label: newLabel.trim(), color: newColor });
    setNewLabel('');
    setNewColor(COLOR_OPTIONS[0].value);
    setAdding(false);
  }

  async function handleSaveEdit(id: string, label: string, color: string) {
    if (!label.trim()) return;
    await updateCategory(id, { label: label.trim(), color });
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    await deleteCategory(id);
    setDeleteId(null);
  }

  const catToDelete = categories.find((c) => c.id === deleteId);

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Configuración</h1>
      <p className="text-sm text-gray-500 mb-8">Ajustes generales del sistema</p>

      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-800">Categorías de Vino</h2>
            <p className="text-xs text-gray-500 mt-0.5">{categories.length} categorías</p>
          </div>
          {!adding && (
            <button onClick={() => setAdding(true)} className="btn-primary">
              <Plus size={15} /> Nueva Categoría
            </button>
          )}
        </div>

        <div className="p-5 space-y-2">
          {adding && (
            <div className="p-4 bg-cream/60 rounded-lg border border-gold/30 space-y-3 mb-4">
              <div>
                <label className="label">Nombre</label>
                <input
                  className="input"
                  placeholder="Ej: Orgánico"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }}
                />
              </div>
              <div>
                <label className="label">Color</label>
                <ColorPicker value={newColor} onChange={setNewColor} />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAdd} disabled={!newLabel.trim()} className="btn-primary">
                  <Check size={14} /> Agregar
                </button>
                <button onClick={() => setAdding(false)} className="btn-secondary">
                  <X size={14} /> Cancelar
                </button>
              </div>
            </div>
          )}

          {categories.length === 0 && !adding && (
            <p className="text-sm text-gray-500 text-center py-6">No hay categorías. Agregá la primera.</p>
          )}

          {categories.map((cat) =>
            editingId === cat.id ? (
              <EditRow
                key={cat.id}
                cat={cat}
                onSave={(label, color) => handleSaveEdit(cat.id, label, color)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div key={cat.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 group">
                <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border w-28 justify-center', cat.color)}>
                  {cat.label}
                </span>
                <span className="text-sm text-gray-500 flex-1">
                  {winesInCategory(cat.id)} vino{winesInCategory(cat.id) !== 1 ? 's' : ''}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingId(cat.id)}
                    className="p-1.5 rounded hover:bg-gray-200 text-gray-500"
                    title="Editar"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteId(cat.id)}
                    className="p-1.5 rounded hover:bg-red-100 text-red-500"
                    title="Eliminar"
                    disabled={winesInCategory(cat.id) > 0}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Eliminar categoría"
        message={`¿Eliminar la categoría "${catToDelete?.label}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        onConfirm={() => handleDelete(deleteId!)}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
