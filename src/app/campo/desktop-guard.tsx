"use client";

import Link from "next/link";
import { Smartphone, ArrowLeft, QrCode } from "lucide-react";

/**
 * /campo é otimizada pra mobile (GPS, captura rápida, formulário em steps).
 * Em telas >= md (768px) mostra aviso pedindo pra abrir no celular.
 *
 * Renderizado por CSS — não bloqueia SSR nem precisa de detect de UA.
 */
export function DesktopGuard() {
  return (
    <div className="fixed inset-0 z-50 hidden flex-col items-center justify-center bg-[var(--color-bg)] px-6 md:flex">
      <div className="mx-auto flex w-full max-w-md flex-col items-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-brand shadow-lg">
          <Smartphone className="h-10 w-10 text-white" />
        </div>

        <h1 className="mb-3 text-2xl font-bold tracking-tight">
          Cadastro em campo é mobile-only
        </h1>

        <p className="mb-8 text-sm text-[var(--color-text-muted)]">
          Esta tela usa GPS, foco em uma coluna e formulário em steps —
          otimizada pro celular durante a visita ao cliente. Abra no seu
          telefone pra cadastrar.
        </p>

        <div className="mb-8 flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-left">
          <QrCode className="h-8 w-8 shrink-0 text-[var(--color-primary)]" />
          <div className="text-xs text-[var(--color-text-muted)]">
            <strong className="text-[var(--color-text)]">
              Acessando do desktop?
            </strong>
            <p className="mt-1">
              Use o cadastro completo em <strong>Clientes → Novo cliente</strong>
              {" "}com mais campos e edição confortável.
            </p>
          </div>
        </div>

        <div className="flex w-full gap-3">
          <Link href="/dashboard" className="flex-1">
            <button className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]">
              <ArrowLeft className="mr-1.5 inline h-3.5 w-3.5" />
              Painel
            </button>
          </Link>
          <Link href="/clientes/novo" className="flex-1">
            <button className="w-full rounded-[var(--radius)] bg-gradient-brand px-5 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg">
              Novo cliente (desktop)
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
