"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Select,
} from "@/components/ui";
import { type Pipeline } from "@/lib/db/schema";
import {
  Plus,
  Pencil,
  Trash2,
  Kanban,
  Star,
  X,
  Sparkles,
} from "lucide-react";
import {
  createPipelineAction,
  updatePipelineAction,
  deletePipelineAction,
} from "@/lib/actions/pipelines";

const COLOR_OPTIONS = [
  { id: "primary", label: "Azul", hex: "var(--color-primary)" },
  { id: "emerald", label: "Verde", hex: "#10b981" },
  { id: "amber", label: "Âmbar", hex: "#f59e0b" },
  { id: "violet", label: "Violeta", hex: "#7c3aed" },
  { id: "cyan", label: "Ciano", hex: "#0891b2" },
  { id: "rose", label: "Rosa", hex: "#e11d48" },
] as const;

const COLOR_BG: Record<string, string> = {
  primary: "bg-[var(--color-primary)]",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  violet: "bg-violet-500",
  cyan: "bg-cyan-500",
  rose: "bg-rose-500",
};

export function PipelinesManager({ pipelines }: { pipelines: Pipeline[] }) {
  const [editing, setEditing] = useState<Pipeline | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Helper */}
      <div className="flex items-start gap-2 rounded-[var(--radius-sm)] border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 px-3 py-2 text-xs text-[var(--color-text-muted)]">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]" />
        <div>
          Crie funis pra separar workflows diferentes. Ex:{" "}
          <strong>Prospecção</strong> (lead → cliente novo),{" "}
          <strong>Pós-venda</strong> (renovação, upsell). O funil padrão fica
          marcado com ★.
        </div>
      </div>

      {/* Botão criar */}
      {!creating && !editing && (
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          Novo funil
        </Button>
      )}

      {/* Form criar/editar */}
      {(creating || editing) && (
        <PipelineForm
          pipeline={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      {/* Lista */}
      {pipelines.length === 0 && !creating ? (
        <Card>
          <EmptyState
            title="Nenhum funil customizado"
            hint="Por enquanto seus deals usam o funil padrão. Crie funis adicionais aqui pra separar workflows."
            icon={Kanban}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {pipelines.map((p) => (
            <Card key={p.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${
                      COLOR_BG[p.color] ?? COLOR_BG.primary
                    }`}
                  >
                    <Kanban className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold">{p.name}</h3>
                      {p.isDefault && (
                        <Badge tone="warning">
                          <Star className="h-2.5 w-2.5" />
                          Padrão
                        </Badge>
                      )}
                      {!p.active && <Badge tone="default">Inativo</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      Posição #{p.position} · cor {COLOR_OPTIONS.find((c) => c.id === p.color)?.label ?? p.color}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-1">
                  <button
                    type="button"
                    onClick={() => setEditing(p)}
                    className="rounded-md p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-primary)]"
                    title="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <DeleteButton id={p.id} name={p.name} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function DeleteButton({ id, name }: { id: string; name: string }) {
  const [, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() => {
        if (
          !confirm(
            `Excluir funil "${name}"? Os negócios vinculados serão movidos pro funil padrão.`,
          )
        )
          return;
        startTransition(async () => {
          const fd = new FormData();
          fd.set("id", id);
          await deletePipelineAction(fd);
          toast.success("Funil excluído");
        });
      }}
      className="rounded-md p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"
      title="Excluir"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}

function PipelineForm({
  pipeline,
  onClose,
}: {
  pipeline: Pipeline | null;
  onClose: () => void;
}) {
  const isEdit = !!pipeline;
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);

    let result;
    if (isEdit && pipeline) {
      result = await updatePipelineAction(pipeline.id, undefined, fd);
    } else {
      result = await createPipelineAction(undefined, fd);
    }
    setSubmitting(false);

    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? "Funil atualizado" : "Funil criado");
    onClose();
  }

  return (
    <Card className="border-[var(--color-primary)]/30 shadow-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            {isEdit ? "Editar funil" : "Novo funil"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">
            Nome do funil *
          </label>
          <Input
            name="name"
            defaultValue={pipeline?.name ?? ""}
            placeholder="Ex: Prospecção, Pós-venda, Renovação"
            required
            minLength={2}
            maxLength={50}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">
            Cor
          </label>
          <Select name="color" defaultValue={pipeline?.color ?? "primary"}>
            {COLOR_OPTIONS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isDefault"
              defaultChecked={pipeline?.isDefault ?? false}
              className="h-4 w-4 accent-[var(--color-primary)]"
            />
            Definir como funil padrão (★)
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="active"
              defaultChecked={pipeline?.active ?? true}
              className="h-4 w-4 accent-[var(--color-primary)]"
            />
            Funil ativo
          </label>
        </div>

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
