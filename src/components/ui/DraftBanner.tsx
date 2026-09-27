import { RotateCcw, X } from 'lucide-react';

interface DraftBannerProps {
  savedAt: number;
  onContinue: () => void;
  onDiscard: () => void;
}

export function DraftBanner({ savedAt, onContinue, onDiscard }: DraftBannerProps) {
  const when = new Date(savedAt).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 mb-4 rounded-lg border border-amber-200 bg-amber-50">
      <RotateCcw size={18} className="text-amber-600 flex-shrink-0" />
      <div className="flex-1 min-w-0 text-sm text-amber-800">
        Se recuperó un borrador sin terminar de <strong>{when}</strong>. ¿Continuás donde quedaste?
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button onClick={onDiscard} className="btn-ghost text-xs py-1 text-amber-700 hover:bg-amber-100">
          <X size={13} />
          Descartar
        </button>
        <button onClick={onContinue} className="btn-primary text-xs py-1.5">
          Continuar
        </button>
      </div>
    </div>
  );
}
