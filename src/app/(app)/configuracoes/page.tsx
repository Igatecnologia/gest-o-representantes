"use client";

import { useActionState } from "react";
import { Lock } from "lucide-react";
import { Button, Card, Input, Label } from "@/components/ui";
import { changePasswordAction } from "@/lib/actions/auth";

const initialState: { error?: string; success?: string } = {};

export default function ConfiguracoesPage() {
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    initialState
  );

  return (
    <Card className="max-w-md">
      <div className="mb-5 flex items-center gap-2">
        <Lock className="h-4 w-4 text-[var(--color-text-muted)]" />
        <h2 className="text-sm font-semibold">Alterar senha</h2>
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="currentPassword">Senha atual</Label>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </div>

        <div>
          <Label htmlFor="newPassword">Nova senha</Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
          />
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Repita a nova senha"
          />
        </div>

        {state.error && (
          <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {state.error}
          </p>
        )}

        {state.success && (
          <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
            {state.success}
          </p>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Alterar senha"}
        </Button>
      </form>
    </Card>
  );
}
