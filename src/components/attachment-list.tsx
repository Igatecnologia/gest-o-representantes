"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Paperclip,
  Upload,
  FileText,
  FileImage,
  Download,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui";
import { dateShort } from "@/lib/utils";
import {
  uploadAttachmentAction,
  deleteAttachmentAction,
} from "@/lib/actions/attachments";

type Attachment = {
  id: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedByName: string;
  createdAt: Date | number;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentList({
  entity,
  entityId,
  attachments,
}: {
  entity: "customer" | "proposal" | "deal";
  entityId: string;
  attachments: Attachment[];
}) {
  const [uploading, setUploading] = useState(false);
  const [, startTransition] = useTransition();

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.set("entity", entity);
    fd.set("entityId", entityId);
    fd.set("file", file);

    setUploading(true);
    try {
      const result = await uploadAttachmentAction(fd);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Arquivo enviado");
      }
    } catch {
      toast.error("Erro ao enviar arquivo");
    } finally {
      setUploading(false);
      e.target.value = ""; // permite mesmo arquivo de novo
    }
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir "${name}"? Essa ação não pode ser desfeita.`)) return;

    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      const result = await deleteAttachmentAction(fd);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Anexo removido");
      }
    });
  }

  return (
    <div>
      {/* Botão de upload */}
      <label className="mb-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)]/30 px-4 py-3 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/5 hover:text-[var(--color-primary)]">
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Upload className="h-3.5 w-3.5" />
        )}
        {uploading ? "Enviando..." : "Anexar arquivo (JPG, PNG, PDF — até 10 MB)"}
        <input
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
          onChange={handleFileUpload}
          disabled={uploading}
        />
      </label>

      {attachments.length === 0 ? (
        <div className="text-center text-xs text-[var(--color-text-dim)] py-2">
          Nenhum anexo ainda.
        </div>
      ) : (
        <ul className="space-y-2">
          {attachments.map((att) => {
            const isImage = att.mimeType.startsWith("image/");
            const Icon = isImage ? FileImage : FileText;
            return (
              <li
                key={att.id}
                className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-2)]/40 px-3 py-2"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-xs font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
                  >
                    {att.filename}
                  </a>
                  <div className="text-[10px] text-[var(--color-text-muted)]">
                    {formatSize(att.size)} ·{" "}
                    {att.uploadedByName.split(" ")[0]} ·{" "}
                    {dateShort(att.createdAt)}
                  </div>
                </div>
                <a
                  href={att.url}
                  download={att.filename}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-3)] hover:text-[var(--color-primary)]"
                  title="Baixar"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => handleDelete(att.id, att.filename)}
                  className="rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"
                  title="Excluir"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
