"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge, Button, Card, EmptyState, Input, Select, Textarea } from "@/components/ui";
import { TEMPLATE_CATEGORIES, type MessageTemplate } from "@/lib/db/schema";
import {
  Plus,
  Pencil,
  Trash2,
  MessageSquareText,
  Send,
  CalendarClock,
  FileText,
  Sparkles,
  X,
} from "lucide-react";
import {
  createTemplateAction,
  updateTemplateAction,
  deleteTemplateAction,
} from "@/lib/actions/templates";

const CATEGORY_ICON: Record<string, React.ComponentType<{ className?: string }>> =
  {
    whatsapp: Send,
    proposal_intro: FileText,
    followup: CalendarClock,
  };

const CATEGORY_TONE: Record<string, "default" | "brand" | "success" | "info"> = {
  whatsapp: "success",
  proposal_intro: "brand",
  followup: "info",
};

export function TemplatesManager({
  templates,
}: {
  templates: MessageTemplate[];
}) {
  const [editing, setEditing] = useState<MessageTemplate | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Helper de placeholders */}
      <div className="flex items-start gap-2 rounded-[var(--radius-sm)] border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 px-3 py-2 text-xs text-[var(--color-text-muted)]">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]" />
        <div>
          <strong className="text-[var(--color-text)]">Placeholders disponíveis:</strong>{" "}
          <code>{"{{nome}}"}</code>, <code>{"{{primeiroNome}}"}</code>,{" "}
          <code>{"{{produto}}"}</code>, <code>{"{{representante}}"}</code>. São
          substituídos automaticamente quando o rep envia.
        </div>
      </div>

      {/* Botão criar */}
      {!creating && !editing && (
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          Novo template
        </Button>
      )}

      {/* Form criar/editar */}
      {(creating || editing) && (
        <TemplateForm
          template={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      {/* Lista */}
      {templates.length === 0 && !creating ? (
        <Card>
          <EmptyState
            title="Nenhum template ainda"
            hint="Crie modelos pra economizar tempo do rep"
            icon={MessageSquareText}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => {
            const Icon = CATEGORY_ICON[t.category] ?? MessageSquareText;
            const meta = TEMPLATE_CATEGORIES.find((c) => c.id === t.category);
            return (
              <Card key={t.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--color-primary)]/10">
                      <Icon className="h-4 w-4 text-[var(--color-primary)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold">{t.title}</h3>
                        <Badge tone={CATEGORY_TONE[t.category] ?? "default"}>
                          {meta?.label ?? t.category}
                        </Badge>
                        {!t.active && <Badge tone="default">Inativo</Badge>}
                      </div>
                      <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs text-[var(--color-text-muted)]">
                        {t.body}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing(t)}
                      className="rounded-md p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-primary)]"
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <DeleteButton id={t.id} title={t.title} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DeleteButton({ id, title }: { id: string; title: string }) {
  const [, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() => {
        if (!confirm(`Excluir template "${title}"?`)) return;
        startTransition(async () => {
          const fd = new FormData();
          fd.set("id", id);
          await deleteTemplateAction(fd);
          toast.success("Template excluído");
        });
      }}
      className="rounded-md p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"
      title="Excluir"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}

function TemplateForm({
  template,
  onClose,
}: {
  template: MessageTemplate | null;
  onClose: () => void;
}) {
  const isEdit = !!template;
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);

    let result;
    if (isEdit && template) {
      result = await updateTemplateAction(template.id, undefined, fd);
    } else {
      result = await createTemplateAction(undefined, fd);
    }

    setSubmitting(false);

    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? "Template atualizado" : "Template criado");
    onClose();
  }

  return (
    <Card className="border-[var(--color-primary)]/30 shadow-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            {isEdit ? "Editar template" : "Novo template"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">
              Categoria *
            </label>
            <Select
              name="category"
              defaultValue={template?.category ?? "whatsapp"}
              required
            >
              {TEMPLATE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">
              Título *
            </label>
            <Input
              name="title"
              defaultValue={template?.title ?? ""}
              placeholder="Ex: Oferta de fim de mês"
              required
              minLength={2}
              maxLength={100}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">
            Mensagem *
          </label>
          <Textarea
            name="body"
            defaultValue={template?.body ?? ""}
            rows={6}
            placeholder={`Olá {{primeiroNome}}! Tudo bem?

Estou retornando sobre o produto {{produto}}. Posso te ajudar com algum esclarecimento?

Abraço,
{{representante}}`}
            required
            minLength={5}
            maxLength={2000}
          />
          <p className="mt-1 text-[10px] text-[var(--color-text-dim)]">
            Use {`{{nome}}`}, {`{{primeiroNome}}`}, {`{{produto}}`}, {`{{representante}}`} pra inserir dados.
          </p>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked={template?.active ?? true}
            className="h-4 w-4 accent-[var(--color-primary)]"
          />
          Template ativo (visível para os reps)
        </label>

        <div className="flex gap-3">
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
