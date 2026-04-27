"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Select } from "@/components/ui";
import { CalendarClock, ArrowLeft } from "lucide-react";
import { createFollowUpAction } from "@/lib/actions/follow-ups";
import Link from "next/link";

export function NewFollowUpForm({
  customers,
  defaultCustomerId,
  defaultProposalId,
  defaultDealId,
}: {
  customers: { id: string; name: string }[];
  defaultCustomerId?: string;
  defaultProposalId?: string;
  defaultDealId?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customerId, setCustomerId] = useState(defaultCustomerId ?? "");
  const [scheduledDate, setScheduledDate] = useState("");
  const [type, setType] = useState(defaultProposalId ? "proposal_sent" : "general");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await createFollowUpAction({
        customerId,
        proposalId: defaultProposalId,
        dealId: defaultDealId,
        scheduledDate,
        type,
        notes,
      });

      if (result?.error) {
        setError(result.error);
        return;
      }

      router.push("/retornos?filter=all");
      router.refresh();
    } catch {
      setError("Erro ao criar retorno. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-[var(--radius-sm)] bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">
            Cliente *
          </label>
          <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
            <option value="">Selecione...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">
            Data do retorno *
          </label>
          <Input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">
            Tipo
          </label>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="proposal_sent">Proposta enviada</option>
            <option value="negotiation">Negociação</option>
            <option value="post_sale">Pós-venda</option>
            <option value="general">Geral</option>
          </Select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">
            Observações
          </label>
          <Input
            placeholder="Ex: Cliente pediu para ligar quinta após reunião..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Link href="/retornos">
            <Button type="button" variant="secondary" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <Button type="submit" size="sm" disabled={loading}>
            <CalendarClock className="h-4 w-4" />
            {loading ? "Salvando..." : "Agendar retorno"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
