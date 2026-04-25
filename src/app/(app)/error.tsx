"use client";

import { Button } from "@/components/ui";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400">
        <span className="text-2xl font-bold">!</span>
      </div>
      <h2 className="mt-4 text-lg font-semibold">Erro inesperado</h2>
      <p className="mt-2 max-w-md text-sm text-[var(--color-text-muted)]">
        Não foi possível carregar esta página. Tente novamente — se o problema persistir, entre em contato com o administrador.
      </p>
      {error.digest && (
        <p className="mt-3 font-mono text-xs text-[var(--color-text-dim)]">
          Ref: {error.digest}
        </p>
      )}
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Tentar novamente</Button>
        <Button variant="secondary" onClick={() => window.location.assign("/dashboard")}>
          Ir para o Dashboard
        </Button>
      </div>
    </div>
  );
}
