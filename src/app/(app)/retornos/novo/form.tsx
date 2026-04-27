"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Select, Textarea } from "@/components/ui";
import { CalendarClock, ArrowLeft, MessageSquareText } from "lucide-react";
import { createFollowUpAction } from "@/lib/actions/follow-ups";
import Link from "next/link";

const TYPE_HINTS: Record<string, string> = {
  proposal_sent: "Ex: Aguardando feedback sobre a proposta enviada na sexta.",
  negotiation: "Ex: Cliente pediu desconto de 10%, vai analisar com sócio.",
  post_sale: "Ex: Confirmar entrega e tirar dúvidas sobre a implantação.",
  general: "Ex: Cliente pediu para ligar quinta após reunião com o time.",
};

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

      router.push("/retornos");
      router.refresh();
    } catch {
      setError("Erro ao criar retorno. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-[var(--radius-sm)] border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">
            Tipo do retorno
          </label>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="proposal_sent">Proposta enviada</option>
            <option value="negotiation">Negociação</option>
            <option value="post_sale">Pós-venda</option>
            <option value="general">Geral</option>
          </Select>
        </div>

        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--color-text)]">
            <MessageSquareText className="h-3.5 w-3.5 text-[var(--color-primary)]" />
            Por que vou retornar? *
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={TYPE_HINTS[type] ?? "Conte aqui o contexto da última conversa..."}
            rows={4}
            required
            minLength={3}
            maxLength={500}
          />
          <p className="mt-1.5 text-[10px] text-[var(--color-text-dim)]">
            Esse texto aparece no card e te lembra do contexto na hora de ligar.
          </p>
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
