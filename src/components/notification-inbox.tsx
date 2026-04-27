"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  X,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Inbox,
} from "lucide-react";
import {
  getNotifications,
  type Notification,
} from "@/lib/actions/notifications";
import { dateShort } from "@/lib/utils";

const TONE_COLOR: Record<Notification["tone"], string> = {
  info: "border-l-[var(--color-primary)] bg-[var(--color-primary)]/5",
  warning: "border-l-amber-500 bg-amber-500/5",
  success: "border-l-emerald-500 bg-emerald-500/5",
  danger: "border-l-[var(--color-danger)] bg-[var(--color-danger)]/5",
};

const TONE_ICON: Record<Notification["tone"], React.ComponentType<{ className?: string }>> =
  {
    info: Clock,
    warning: AlertTriangle,
    success: CheckCircle2,
    danger: AlertTriangle,
  };

const TONE_TEXT: Record<Notification["tone"], string> = {
  info: "text-[var(--color-primary)]",
  warning: "text-amber-600",
  success: "text-emerald-600",
  danger: "text-[var(--color-danger)]",
};

export function NotificationInbox() {
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  // Buscar 1 vez ao abrir; recarregar manualmente via close+open
  React.useEffect(() => {
    if (!open || loaded) return;
    setLoading(true);
    getNotifications()
      .then(setNotifications)
      .finally(() => {
        setLoading(false);
        setLoaded(true);
      });
  }, [open, loaded]);

  // Pré-fetch contagem ao montar (silenciosa) pra mostrar badge sem abrir
  const [unreadCount, setUnreadCount] = React.useState<number | null>(null);
  React.useEffect(() => {
    getNotifications().then((list) => {
      // Conta apenas as urgentes (warning + danger) como "unread"
      const urgent = list.filter(
        (n) => n.tone === "warning" || n.tone === "danger",
      ).length;
      setUnreadCount(urgent);
      // Cache pra primeira abertura
      setNotifications(list);
      setLoaded(true);
    });
  }, []);

  const refresh = () => {
    setLoading(true);
    getNotifications()
      .then((list) => {
        setNotifications(list);
        const urgent = list.filter(
          (n) => n.tone === "warning" || n.tone === "danger",
        ).length;
        setUnreadCount(urgent);
      })
      .finally(() => setLoading(false));
  };

  return (
    <>
      <button
        type="button"
        aria-label="Notificações"
        onClick={() => setOpen(true)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
      >
        <Bell className="h-4 w-4" />
        {unreadCount !== null && unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-danger)] px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        >
          <div
            className="absolute right-0 top-0 h-full w-full max-w-md border-l border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl md:max-w-md"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Caixa de notificações"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-primary)]/10">
                  <Inbox className="h-4 w-4 text-[var(--color-primary)]" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Notificações</h2>
                  <p className="text-[10px] text-[var(--color-text-muted)]">
                    {loading
                      ? "Atualizando…"
                      : `${notifications.length} ite${notifications.length === 1 ? "m" : "ns"}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={refresh}
                  className="rounded-md p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
                  title="Atualizar"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
                    <path d="M21 3v5h-5" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Lista */}
            <div className="h-[calc(100vh-72px)] overflow-y-auto p-3">
              {notifications.length === 0 && !loading ? (
                <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
                  <CheckCircle2 className="h-8 w-8 text-[var(--color-text-dim)]" />
                  <p className="text-sm font-medium text-[var(--color-text-muted)]">
                    Tudo em dia 🎉
                  </p>
                  <p className="text-xs text-[var(--color-text-dim)]">
                    Nenhuma pendência ou alerta no momento.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {notifications.map((n) => {
                    const Icon = TONE_ICON[n.tone];
                    return (
                      <li key={n.id}>
                        <Link
                          href={n.href}
                          onClick={() => setOpen(false)}
                          className={`block rounded-[var(--radius-sm)] border-l-2 px-3 py-2.5 transition-colors hover:bg-[var(--color-surface-2)]/60 ${TONE_COLOR[n.tone]}`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className={`mt-0.5 ${TONE_TEXT[n.tone]}`}>
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold text-[var(--color-text)]">
                                {n.title}
                              </div>
                              <p className="mt-0.5 line-clamp-2 text-xs text-[var(--color-text-muted)]">
                                {n.description}
                              </p>
                              {n.date && (
                                <div className="mt-1 text-[10px] text-[var(--color-text-dim)]">
                                  {dateShort(n.date)}
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
