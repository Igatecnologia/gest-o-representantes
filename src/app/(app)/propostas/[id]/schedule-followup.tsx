"use client";

import { useState } from "react";
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
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    setLoading(true);

    // Se agendou retorno, criar ANTES de mudar status (para evitar revalidate antes)
    if (scheduledDate) {
      await createFollowUpAction({
        customerId,
        proposalId,
        scheduledDate,
        type: "proposal_sent",
        notes: notes || "Retorno após envio de proposta",
      });
    }

    // Marcar proposta como enviada (revalidate paths ao final)
    const formData = new FormData();
    formData.set("id", proposalId);
    formData.set("status", "sent");
    await updateProposalStatusAction(formData);

    setLoading(false);
  }

  if (!showSchedule) {
    return (
      <div className="space-y-2">
        <form action={updateProposalStatusAction}>
          <input type="hidden" name="id" value={proposalId} />
          <input type="hidden" name="status" value="sent" />
          <Button size="sm" className="w-full" type="button" onClick={() => setShowSchedule(true)}>
            <Send className="h-3.5 w-3.5" />
            Marcar como enviada
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-[var(--radius)] border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 p-3">
      <p className="text-xs font-medium text-[var(--color-text)]">
        Agendar retorno com o cliente?
      </p>
      <div>
        <label className="mb-1 block text-[10px] text-[var(--color-text-muted)]">
          Data do retorno (opcional)
        </label>
        <Input
          type="date"
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
        />
      </div>
      {scheduledDate && (
        <div>
          <label className="mb-1 block text-[10px] text-[var(--color-text-muted)]">
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
