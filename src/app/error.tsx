"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg)] px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
        <span className="text-2xl">!</span>
      </div>
      <h1 className="mt-4 text-xl font-semibold">Algo deu errado</h1>
      <p className="mt-2 max-w-sm text-sm text-[var(--color-text-muted)]">
        Ocorreu um erro inesperado. Tente novamente ou volte para o painel.
      </p>
      {error.digest && (
        <p className="mt-3 font-mono text-xs text-[var(--color-text-dim)]">
          Referência: {error.digest}
        </p>
      )}
      <div className="mt-8 flex gap-3">
        <button
          onClick={reset}
          className="rounded-[var(--radius)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)]"
        >
          Tentar novamente
        </button>
        <a
          href="/dashboard"
          className="rounded-[var(--radius)] border border-[var(--color-border)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-2)]"
        >
          Voltar ao painel
        </a>
      </div>
    </main>
  );
}
