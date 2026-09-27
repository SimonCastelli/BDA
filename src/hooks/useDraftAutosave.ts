import { useEffect, useRef, useState } from 'react';

interface DraftEnvelope<T> {
  data: T;
  savedAt: number;
}

interface UseDraftAutosaveOptions<T> {
  /** Clave única de localStorage para este formulario (incluir el id cuando es una edición). */
  storageKey: string;
  /** Snapshot actual del formulario. */
  data: T;
  /** false mientras la página todavía no terminó de inicializarse (ej: cargando un registro existente). */
  enabled: boolean;
  /** Evita persistir/crear un borrador para un formulario vacío o sin tocar. */
  isMeaningful: (data: T) => boolean;
  /** Se dispara después de cada guardado local exitoso — acá la página sincroniza contra el backend. */
  onPersisted?: (data: T) => void;
  debounceMs?: number;
}

interface UseDraftAutosaveResult<T> {
  /** Borrador encontrado en localStorage al montar. La página decide si aplicarlo o no. */
  restored: DraftEnvelope<T> | null;
  dismissRestored: () => void;
  clearDraft: () => void;
}

/**
 * Guarda un snapshot del formulario en localStorage cada vez que cambia (con debounce),
 * de forma instantánea y sin depender de la conexión — así se puede recuperar el trabajo
 * si se corta la conexión, se cierra el navegador o se recarga la página a mitad de carga.
 *
 * Además expone `onPersisted` para que la página, en paralelo, sincronice un borrador real
 * contra el backend (visible en la sección de Borradores).
 */
export function useDraftAutosave<T>({
  storageKey,
  data,
  enabled,
  isMeaningful,
  onPersisted,
  debounceMs = 1000,
}: UseDraftAutosaveOptions<T>): UseDraftAutosaveResult<T> {
  const [restored, setRestored] = useState<DraftEnvelope<T> | null>(null);
  const checkedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Al montar: revisar una sola vez si ya hay un borrador guardado bajo esta key.
  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as DraftEnvelope<T>;
        if (parsed && typeof parsed.savedAt === 'number') {
          setRestored(parsed);
        }
      }
    } catch {
      // localStorage inaccesible o con datos corruptos: seguimos sin restaurar.
    }
  }, [storageKey]);

  function clearDraft() {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignorar
    }
  }

  function dismissRestored() {
    setRestored(null);
  }

  useEffect(() => {
    if (!enabled) return;
    // No pisar un borrador recuperado hasta que la página decida (Continuar / Descartar).
    if (restored) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (!isMeaningful(data)) {
        clearDraft();
        return;
      }
      try {
        localStorage.setItem(storageKey, JSON.stringify({ data, savedAt: Date.now() }));
      } catch {
        // almacenamiento lleno o inaccesible — no bloquea el resto del flujo.
      }
      onPersisted?.(data);
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, enabled, restored, storageKey]);

  // Si se cortó la conexión durante el autosave, reintentar una vez al reconectar.
  useEffect(() => {
    function handleOnline() {
      if (enabled && !restored && isMeaningful(data)) onPersisted?.(data);
    }
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, enabled, restored]);

  return { restored, dismissRestored, clearDraft };
}
