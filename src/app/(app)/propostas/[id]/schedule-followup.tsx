"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { CalendarClock, Send } from "lucide-react";
import { createFollowUpAction } from "@/lib/actions/follow-ups";
import { updateProposalStatusAction } from "@/lib/actions/proposals";

export function MarkAsSentWithFollowUp({
  proposalId,
  customerId,
}: {
  proposalId: string;
  customerId: string;
}) {
  const router = useRouter();
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSend() {
    setLoading(true);
    setError("");

    try {
      // 1. Criar retorno PRIMEIRO (se tiver data)
      if (scheduledDate) {
        const result = await createFollowUpAction({
          customerId,
          proposalId,
          scheduledDate,
          type: "proposal_sent",
          notes: notes || "Retorno após envio de proposta",
        });
        if (result?.error) {
          setError(result.error);
          return;
        }
      }

      // 2. Marcar proposta como enviada
      const formData = new FormData();
      formData.set("id", proposalId);
      formData.set("status", "sent");
      await updateProposalStatusAction(formData);

      // revalidatePath no server action já atualiza a página automaticamente
      router.refresh();
    } catch {
      setError("Erro ao enviar proposta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (!showSchedule) {
    return (
      <Button size="sm" className="w-full" type="button" onClick={() => setShowSchedule(true)}>
        <Send className="h-3.5 w-3.5" />
        Marcar como enviada
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
      <p className="text-xs font-medium text-[var(--color-text)]">
        Agendar retorno com o cliente?
      </p>

      {error && (
        <div className="rounded border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-3 py-2 text-xs text-[var(--color-danger)]">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-[11px] text-[var(--color-text-muted)]">
          Data do retorno
        </label>
        <Input
          type="date"
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
        />
      </div>
      {scheduledDate && (
        <div>
          <label className="mb-1 block text-[11px] text-[var(--color-text-muted)]">
            Observação
          </label>
          <Input
            placeholder="Ex: Cliente pediu retorno após análise..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      )}
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1"
          onClick={handleSend}
          disabled={loading}
        >
          <Send className="h-3.5 w-3.5" />
          {loading ? "Enviando..." : scheduledDate ? "Enviar + Agendar" : "Só enviar"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowSchedule(false)}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
