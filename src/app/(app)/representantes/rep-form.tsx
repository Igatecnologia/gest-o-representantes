"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label } from "@/components/ui";
import { KeyRound } from "lucide-react";
import type { Representative } from "@/lib/db/schema";

type ActionResult = { error?: string } | undefined;
type ActionFn = (prev: ActionResult, formData: FormData) => Promise<ActionResult>;

export function RepForm({
  action,
  initial,
  submitLabel,
  showLoginSection = false,
}: {
  action: ActionFn;
  initial?: Representative;
  submitLabel: string;
  showLoginSection?: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    action,
    undefined
  );
  const [createLogin, setCreateLogin] = useState(false);

  return (
    <Card className="max-w-2xl">
      <form action={formAction} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="name">Nome completo *</Label>
            <Input id="name" name="name" required defaultValue={initial?.name ?? ""} />
          </div>

          <div>
            <Label htmlFor="email">E-mail de contato</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={initial?.email ?? ""}
            />
          </div>

          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" name="phone" defaultValue={initial?.phone ?? ""} />
          </div>

          <div>
            <Label htmlFor="commissionPct">Comissão (%) *</Label>
            <Input
              id="commissionPct"
              name="commissionPct"
              type="number"
              step="0.01"
              min="0"
              max="100"
              required
              defaultValue={initial?.commissionPct ?? 10}
            />
          </div>

          <div className="flex items-end">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="active"
                defaultChecked={initial?.active ?? true}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              Ativo
            </label>
          </div>
        </div>

        {/* Login do rep — só ao criar */}
        {showLoginSection && (
          <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]/50 p-4">
            <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                name="createLogin"
                checked={createLogin}
                onChange={(e) => setCreateLogin(e.target.checked)}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              <KeyRound className="h-3.5 w-3.5 text-[var(--color-primary)]" />
              Criar acesso de login para este representante
            </label>

            {createLogin && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <Label htmlFor="loginEmail">E-mail de login *</Label>
                  <Input
                    id="loginEmail"
                    name="loginEmail"
                    type="email"
                    required={createLogin}
                    placeholder="rep@empresa.com"
                  />
                </div>
                <div>
                  <Label htmlFor="loginPassword">Senha inicial * (min 6)</Label>
                  <Input
                    id="loginPassword"
                    name="loginPassword"
                    type="text"
                    required={createLogin}
                    minLength={6}
                    placeholder="mudar123"
                  />
                </div>
                <p className="md:col-span-2 text-xs text-[var(--color-text-muted)]">
                  O rep usará essas credenciais para logar e ver apenas os próprios
                  clientes, negócios e comissões.
                </p>
              </div>
            )}
          </div>
        )}

        {state?.error && (
          <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {state.error}
          </p>
        )}

        <div className="flex gap-2 border-t border-[var(--color-border)] pt-5">
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : submitLabel}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
