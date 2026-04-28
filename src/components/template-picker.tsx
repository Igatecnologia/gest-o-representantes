"use client";

import { useEffect, useState } from "react";
import {
  MessageSquareText,
  ChevronDown,
  Sparkles,
  Send,
  CalendarClock,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getActiveTemplates } from "@/lib/actions/templates";
import type { MessageTemplate } from "@/lib/db/schema";

const CATEGORY_ICON: Record<string, React.ComponentType<{ className?: string }>> =
  {
    whatsapp: Send,
    proposal_intro: FileText,
    followup: CalendarClock,
  };

/**
 * Aplica substituição de placeholders no body do template.
 * Suporta: {{nome}}, {{primeiroNome}}, {{produto}}, {{representante}}.
 */
export function applyTemplate(
  body: string,
  vars: {
    nome?: string;
    produto?: string;
    representante?: string;
  },
): string {
  const primeiroNome = vars.nome?.split(" ")[0] ?? "";
  return body
    .replaceAll("{{nome}}", vars.nome ?? "")
    .replaceAll("{{primeiroNome}}", primeiroNome)
    .replaceAll("{{produto}}", vars.produto ?? "")
    .replaceAll("{{representante}}", vars.representante ?? "");
}

/**
 * Dropdown que carrega templates ativos da categoria especificada
 * e ao selecionar chama onSelect com o body já com placeholders aplicados.
 */
export function TemplatePicker({
  category,
  vars,
  onSelect,
  className,
  buttonLabel = "Usar template",
}: {
  category: "whatsapp" | "proposal_intro" | "followup";
  vars: { nome?: string; produto?: string; representante?: string };
  onSelect: (text: string) => void;
  className?: string;
  buttonLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || loaded) return;
    getActiveTemplates(category).then((list) => {
      setTemplates(list);
      setLoaded(true);
    });
  }, [open, loaded, category]);

  if (loaded && templates.length === 0 && open) {
    // Sem templates → fecha e dispara aviso (apenas uma vez)
    setOpen(false);
  }

  const Icon = CATEGORY_ICON[category] ?? MessageSquareText;

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]"
      >
        <Sparkles className="h-3 w-3" />
        {buttonLabel}
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <>
          {/* Backdrop pra fechar ao clicar fora */}
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />

          <div className="absolute right-0 top-full z-40 mt-1 w-72 max-h-[320px] overflow-y-auto rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
            {!loaded ? (
              <div className="px-3 py-4 text-center text-xs text-[var(--color-text-muted)]">
                Carregando…
              </div>
            ) : templates.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-[var(--color-text-muted)]">
                Nenhum template criado.
                <br />
                <span className="text-[10px] text-[var(--color-text-dim)]">
                  Admin cria em /configuracoes/templates
                </span>
              </div>
            ) : (
              <ul>
                {templates.map((t) => {
                  const preview = applyTemplate(t.body, vars).slice(0, 60);
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(applyTemplate(t.body, vars));
                          setOpen(false);
                        }}
                        className="flex w-full items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-[var(--color-surface-2)]"
                      >
                        <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-semibold text-[var(--color-text)]">
                            {t.title}
                          </div>
                          <div className="mt-0.5 line-clamp-2 text-[10px] text-[var(--color-text-muted)]">
                            {preview}
                            {t.body.length > 60 ? "…" : ""}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
