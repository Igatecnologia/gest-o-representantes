"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Persiste um objeto de form em localStorage até o submit.
 * Recupera ao montar; limpa quando handleSubmit é bem-sucedido.
 *
 * Uso:
 *   const [form, setForm, clearDraft, restored] = useFormDraft("clientes-novo", initialForm);
 *   // ... atualiza form normalmente, autosave acontece em background
 *   // após submit OK: clearDraft();
 *   // se restored=true, mostre banner avisando que recuperou
 *
 * Para desativar (ex: ao editar registro existente), passe enabled=false.
 * O hook funciona como useState normal nesse caso.
 */
export function useFormDraft<T extends object>(
  key: string,
  initialValue: T,
  enabled: boolean = true,
): [T, (next: T | ((prev: T) => T)) => void, () => void, boolean] {
  const storageKey = `iga-draft:${key}`;
  const [value, setValueState] = useState<T>(initialValue);
  const [restored, setRestored] = useState(false);
  const skipNextSave = useRef(true);

  // Recupera draft no mount
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as T;
        setValueState({ ...initialValue, ...parsed });
        setRestored(true);
      }
    } catch {
      // ignora erros de parse / quota
    }
    // só roda no mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Salva debounced (300ms) sempre que value muda
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    const id = setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(value));
      } catch {
        // ignora quota / privado
      }
    }, 300);
    return () => clearTimeout(id);
  }, [value, storageKey, enabled]);

  const setValue = (next: T | ((prev: T) => T)) => {
    setValueState(next);
  };

  const clearDraft = () => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(storageKey);
      setRestored(false);
    } catch {
      /* noop */
    }
  };

  return [value, setValue, clearDraft, restored];
}
