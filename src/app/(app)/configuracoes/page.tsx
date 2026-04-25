"use client";

import { useActionState, useEffect, useState } from "react";
import { Lock, LogOut, Download, Smartphone } from "lucide-react";
import { Button, Card, Input, Label } from "@/components/ui";
import { changePasswordAction, logoutAction } from "@/lib/actions/auth";

const initialState: { error?: string; success?: string } = {};

export default function ConfiguracoesPage() {
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    initialState
  );

  // PWA install prompt
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detecta se já está instalado como PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    const prompt = installPrompt as BeforeInstallPromptEvent;
    prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === "accepted") {
      setIsInstalled(true);
    }
    setInstallPrompt(null);
  }

  return (
    <div className="space-y-6">
      {/* Instalar app — só aparece se disponível */}
      {!isInstalled && (
        <Card className="max-w-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] bg-[var(--color-primary)]/10">
                <Smartphone className="h-5 w-5 text-[var(--color-primary)]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Instalar aplicativo</h2>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  Acesse direto da tela inicial do celular.
                </p>
              </div>
            </div>
            {installPrompt ? (
              <Button size="sm" onClick={handleInstall}>
                <Download className="h-3.5 w-3.5" />
                Instalar
              </Button>
            ) : (
              <p className="text-xs text-[var(--color-text-muted)] max-w-[140px] text-right">
                Use o menu do navegador → "Adicionar à tela inicial"
              </p>
            )}
          </div>
        </Card>
      )}

      {isInstalled && (
        <Card className="max-w-md">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-emerald-400" />
            <p className="text-sm text-emerald-400 font-medium">App instalado neste dispositivo</p>
          </div>
        </Card>
      )}

      {/* Logout */}
      <Card className="max-w-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Sessão</h2>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Encerre sua sessão neste dispositivo.
            </p>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="danger" size="sm">
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </Button>
          </form>
        </div>
      </Card>

      {/* Alterar senha */}
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
    </div>
  );
}

// Tipo do evento PWA
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
