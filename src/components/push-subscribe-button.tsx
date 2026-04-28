"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, BellOff, Loader2, Send, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui";
import {
  subscribePushAction,
  unsubscribePushAction,
  sendTestPushAction,
} from "@/lib/actions/push";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

type State =
  | { kind: "unsupported" }
  | { kind: "no-vapid" }
  | { kind: "denied" }
  | { kind: "loading" }
  | { kind: "subscribed"; endpoint: string }
  | { kind: "unsubscribed" };

function urlBase64ToBuffer(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = window.atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buffer;
}

export function PushSubscribeButton() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!VAPID_PUBLIC) {
      setState({ kind: "no-vapid" });
      return;
    }
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setState({ kind: "unsupported" });
      return;
    }
    if (Notification.permission === "denied") {
      setState({ kind: "denied" });
      return;
    }

    // Verifica se já tem subscription ativa
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (sub) {
          setState({ kind: "subscribed", endpoint: sub.endpoint });
        } else {
          setState({ kind: "unsubscribed" });
        }
      })
      .catch(() => setState({ kind: "unsubscribed" }));
  }, []);

  async function handleSubscribe() {
    setBusy(true);
    try {
      // Pede permissão se ainda não foi concedida
      if (Notification.permission !== "granted") {
        const perm = await Notification.requestPermission();
        if (perm !== "granted") {
          if (perm === "denied") {
            setState({ kind: "denied" });
            toast.error("Permissão de notificação negada");
          } else {
            toast.info("Permissão não concedida");
          }
          setBusy(false);
          return;
        }
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToBuffer(VAPID_PUBLIC),
      });

      const json = sub.toJSON();
      const result = await subscribePushAction({
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
        userAgent: navigator.userAgent,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        setState({ kind: "subscribed", endpoint: sub.endpoint });
        toast.success("Notificações ativadas! 🔔");
      }
    } catch (err) {
      console.error("[push subscribe]", err);
      toast.error("Erro ao ativar notificações");
    } finally {
      setBusy(false);
    }
  }

  async function handleUnsubscribe() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribePushAction(sub.endpoint);
        await sub.unsubscribe();
      }
      setState({ kind: "unsubscribed" });
      toast.success("Notificações desativadas");
    } catch (err) {
      console.error("[push unsubscribe]", err);
      toast.error("Erro ao desativar");
    } finally {
      setBusy(false);
    }
  }

  async function handleTest() {
    setBusy(true);
    try {
      const result = await sendTestPushAction();
      if (result.sent > 0) {
        toast.success(`Push de teste enviado (${result.sent} device(s))`);
      } else {
        toast.error("Não conseguiu enviar — verifique a configuração");
      }
    } catch (err) {
      console.error("[push test]", err);
      toast.error("Erro ao enviar teste");
    } finally {
      setBusy(false);
    }
  }

  if (state.kind === "loading") {
    return (
      <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Verificando…
      </div>
    );
  }

  if (state.kind === "unsupported") {
    return (
      <div className="flex items-start gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-2)]/40 p-3 text-xs text-[var(--color-text-muted)]">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <div>
          Seu navegador não suporta notificações push. Use um navegador
          moderno (Chrome, Edge, Firefox, Safari 16.4+).
        </div>
      </div>
    );
  }

  if (state.kind === "no-vapid") {
    return (
      <div className="flex items-start gap-2 rounded-[var(--radius-sm)] border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-600">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <div>
          Push notifications não configurado no servidor. Admin precisa
          definir as variáveis VAPID no Vercel.
        </div>
      </div>
    );
  }

  if (state.kind === "denied") {
    return (
      <div className="space-y-2">
        <div className="flex items-start gap-2 rounded-[var(--radius-sm)] border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 p-3 text-xs text-[var(--color-danger)]">
          <BellOff className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <div>
            Você bloqueou notificações pra este site. Pra reativar, vá nas
            permissões do site no navegador (ícone de cadeado na barra de
            endereço) e libere notificações.
          </div>
        </div>
      </div>
    );
  }

  if (state.kind === "subscribed") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 px-3 py-2 text-xs text-[var(--color-success)]">
          <Bell className="h-3.5 w-3.5" />
          <span className="font-medium">Notificações ativadas neste device</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleTest}
            disabled={busy}
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Testar notificação
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleUnsubscribe}
            disabled={busy}
          >
            <BellOff className="h-3.5 w-3.5" />
            Desativar
          </Button>
        </div>
      </div>
    );
  }

  // unsubscribed
  return (
    <Button onClick={handleSubscribe} disabled={busy} size="sm">
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Bell className="h-3.5 w-3.5" />
      )}
      Ativar notificações
    </Button>
  );
}
