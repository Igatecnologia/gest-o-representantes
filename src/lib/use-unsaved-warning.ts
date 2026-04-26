"use client";

import { useEffect } from "react";

/**
 * Exibe aviso do navegador ao tentar sair da página com dados não salvos.
 * @param dirty - true se o formulário tem alterações não salvas
 */
export function useUnsavedWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);
}
