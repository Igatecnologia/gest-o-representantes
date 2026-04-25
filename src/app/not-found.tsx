import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg)] px-6 text-center">
      <p className="text-7xl font-bold tracking-tighter text-[var(--color-primary)]">404</p>
      <h1 className="mt-4 text-xl font-semibold">Página não encontrada</h1>
      <p className="mt-2 max-w-sm text-sm text-[var(--color-text-muted)]">
        O endereço que você acessou não existe ou foi removido.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 rounded-[var(--radius)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)]"
      >
        Voltar ao painel
      </Link>
    </main>
  );
}
