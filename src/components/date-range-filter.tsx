"use client";

import { useState } from "react";
import { Button, Card, Input } from "@/components/ui";
import { CalendarRange, X } from "lucide-react";
import { dateShort } from "@/lib/utils";

/**
 * Filtro de período compartilhado pra listas históricas (vendas, comissões,
 * propostas, retornos). Mantém estado local e chama onApply com strings
 * YYYY-MM-DD (ou vazio pra limpar).
 */
export function DateRangeFilter({
  from,
  to,
  onApply,
  onClear,
}: {
  from: string;
  to: string;
  onApply: (from: string, to: string) => void;
  onClear: () => void;
}) {
  const [fromInput, setFromInput] = useState(from);
  const [toInput, setToInput] = useState(to);

  function handleApply() {
    onApply(fromInput, toInput);
  }

  function handleClear() {
    setFromInput("");
    setToInput("");
    onClear();
  }

  const hasActive = !!(from || to);

  return (
    <Card className="bg-[var(--color-surface)]/50">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[140px]">
          <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            De
          </label>
          <Input
            type="date"
            value={fromInput}
            onChange={(e) => setFromInput(e.target.value)}
            max={toInput || undefined}
          />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            Até
          </label>
          <Input
            type="date"
            value={toInput}
            onChange={(e) => setToInput(e.target.value)}
            min={fromInput || undefined}
          />
        </div>
        <Button size="sm" onClick={handleApply} disabled={!fromInput && !toInput}>
          <CalendarRange className="h-3.5 w-3.5" />
          Aplicar
        </Button>
        {hasActive && (
          <Button size="sm" variant="ghost" onClick={handleClear}>
            <X className="h-3.5 w-3.5" />
            Limpar
          </Button>
        )}
      </div>
      {hasActive && (
        <p className="mt-2 text-[10px] text-[var(--color-text-muted)]">
          Mostrando registros{" "}
          {from && <strong>de {dateShort(new Date(from + "T00:00:00"))}</strong>}{" "}
          {to && <strong>até {dateShort(new Date(to + "T00:00:00"))}</strong>}
        </p>
      )}
    </Card>
  );
}
