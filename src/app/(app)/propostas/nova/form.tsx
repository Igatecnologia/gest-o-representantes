"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label, Select, Textarea, Badge } from "@/components/ui";
import { brl, toCents } from "@/lib/utils";
import { createProposalAction } from "@/lib/actions/proposals";
import { Plus, Trash2, AlertCircle } from "lucide-react";

type CustomerOpt = { id: string; name: string };
type ProductOpt = {
  id: string;
  name: string;
  price: number;
  implementationPrice: number;
  type: string;
};

type LineItem = {
  key: string;
  label: string;
  type: "one_time" | "monthly" | "yearly";
  defaultValue: number; // reais
  value: number; // reais
  custom: boolean;
};

let keyCounter = 0;
function nextKey() {
  return `item-${++keyCounter}`;
}

function typeLabel(type: string) {
  switch (type) {
    case "one_time": return "Único";
    case "monthly": return "Mensal";
    case "yearly": return "Anual";
    default: return type;
  }
}

export function ProposalForm({
  customers,
  products,
}: {
  customers: CustomerOpt[];
  products: ProductOpt[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);

  // Quando seleciona um produto, monta os itens padrão
  function onProductChange(id: string) {
    setProductId(id);
    const product = products.find((p) => p.id === id);
    if (!product) {
      setItems([]);
      return;
    }

    const newItems: LineItem[] = [];

    if (product.implementationPrice > 0) {
      newItems.push({
        key: nextKey(),
        label: "Implantação",
        type: "one_time",
        defaultValue: product.implementationPrice / 100,
        value: product.implementationPrice / 100,
        custom: false,
      });
    }

    const isSubscription = product.type.startsWith("subscription");
    newItems.push({
      key: nextKey(),
      label: isSubscription ? "Mensalidade" : "Licença",
      type: isSubscription ? "monthly" : "one_time",
      defaultValue: product.price / 100,
      value: product.price / 100,
      custom: false,
    });

    setItems(newItems);
  }

  function updateItemValue(key: string, val: number) {
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, value: val } : i))
    );
  }

  function updateItemLabel(key: string, label: string) {
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, label } : i))
    );
  }

  function updateItemType(key: string, type: LineItem["type"]) {
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, type } : i))
    );
  }

  function addCustomItem() {
    setItems((prev) => [
      ...prev,
      {
        key: nextKey(),
        label: "",
        type: "one_time",
        defaultValue: 0,
        value: 0,
        custom: true,
      },
    ]);
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  const totalOneTime = items
    .filter((i) => i.type === "one_time")
    .reduce((sum, i) => sum + i.value, 0);

  const totalMonthly = items
    .filter((i) => i.type === "monthly")
    .reduce((sum, i) => sum + i.value, 0);

  const totalYearly = items
    .filter((i) => i.type === "yearly")
    .reduce((sum, i) => sum + i.value, 0);

  function handleSubmit() {
    if (!customerId) {
      setError("Selecione um cliente.");
      return;
    }
    if (!productId) {
      setError("Selecione um sistema/produto.");
      return;
    }
    if (items.length === 0) {
      setError("Adicione pelo menos um item.");
      return;
    }
    if (items.some((i) => !i.label.trim())) {
      setError("Preencha o nome de todos os itens.");
      return;
    }

    setError("");
    startTransition(async () => {
      const result = await createProposalAction({
        customerId,
        productId,
        validUntil: validUntil || undefined,
        notes: notes || undefined,
        items: items.map((i) => ({
          label: i.label,
          type: i.type,
          defaultValue: i.defaultValue,
          value: i.value,
        })),
      });
      if (result?.error) setError(result.error);
    });
  }

  const missingDeps = customers.length === 0 || products.length === 0;

  if (missingDeps) {
    return (
      <Card className="max-w-2xl">
        <p className="text-sm">
          Cadastre pelo menos um <strong>cliente</strong> e um{" "}
          <strong>produto ativo</strong> antes de criar uma proposta.
        </p>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="customerId">Cliente *</Label>
            <Select
              id="customerId"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
            >
              <option value="">— selecione —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="productId">Sistema / Produto *</Label>
            <Select
              id="productId"
              value={productId}
              onChange={(e) => onProductChange(e.target.value)}
              required
            >
              <option value="">— selecione —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="validUntil">Válida até</Label>
            <Input
              id="validUntil"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Itens da proposta */}
      {items.length > 0 && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Itens da proposta</h2>
            <Badge tone="brand">{items.length} item(ns)</Badge>
          </div>

          <div className="space-y-3">
            {items.map((item) => {
              const diff = item.value !== item.defaultValue && item.defaultValue > 0;
              return (
                <div
                  key={item.key}
                  className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface-2)]/40 p-4"
                >
                  {/* Header: nome + tipo + remover */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      {item.custom ? (
                        <Input
                          value={item.label}
                          onChange={(e) => updateItemLabel(item.key, e.target.value)}
                          placeholder="Ex: Treinamento, Suporte..."
                        />
                      ) : (
                        <span className="text-sm font-medium">{item.label}</span>
                      )}
                    </div>
                    {item.custom ? (
                      <Select
                        value={item.type}
                        onChange={(e) => updateItemType(item.key, e.target.value as LineItem["type"])}
                        className="w-24 shrink-0"
                      >
                        <option value="one_time">Único</option>
                        <option value="monthly">Mensal</option>
                        <option value="yearly">Anual</option>
                      </Select>
                    ) : (
                      <Badge tone={item.type === "monthly" ? "brand" : "default"} className="shrink-0">
                        {typeLabel(item.type)}
                      </Badge>
                    )}
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-muted)] transition-colors hover:bg-red-500/10 hover:text-red-400"
                      aria-label={`Remover ${item.label || "item"}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Valores */}
                  <div className="mt-3 flex items-end gap-4">
                    {item.defaultValue > 0 && (
                      <div className="text-xs text-[var(--color-text-muted)]">
                        Padrão: {brl(toCents(item.defaultValue))}
                      </div>
                    )}
                    <div className="ml-auto w-40">
                      <Label>Valor (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.value}
                        onChange={(e) => updateItemValue(item.key, Number(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  {diff && (
                    <p className="mt-2 text-xs text-amber-400">
                      Contra-proposta: valor alterado de {brl(toCents(item.defaultValue))} para{" "}
                      {brl(toCents(item.value))}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addCustomItem}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-[var(--radius)] border border-dashed border-[var(--color-border-strong)] py-2.5 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar item personalizado
          </button>
        </Card>
      )}

      {/* Resumo + notas */}
      {items.length > 0 && (
        <Card>
          <h2 className="mb-4 text-sm font-semibold">Resumo</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-2)]/40 px-4 py-3">
              <div className="text-xs text-[var(--color-text-muted)]">Valores únicos</div>
              <div className="mt-1 text-lg font-bold tabular-nums">{brl(toCents(totalOneTime))}</div>
            </div>
            <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-2)]/40 px-4 py-3">
              <div className="text-xs text-[var(--color-text-muted)]">Mensal recorrente</div>
              <div className="mt-1 text-lg font-bold tabular-nums text-[var(--color-primary)]">
                {brl(toCents(totalMonthly))}
              </div>
            </div>
            {totalYearly > 0 && (
              <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-2)]/40 px-4 py-3">
                <div className="text-xs text-[var(--color-text-muted)]">Anual recorrente</div>
                <div className="mt-1 text-lg font-bold tabular-nums">{brl(toCents(totalYearly))}</div>
              </div>
            )}
          </div>

          <div className="mt-4">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Condições, prazos de pagamento, etc."
            />
          </div>
        </Card>
      )}

      {/* Erro + Submit */}
      {error && (
        <div className="flex items-center gap-2 rounded-[var(--radius)] border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={isPending || items.length === 0}>
          {isPending ? "Criando..." : "Criar proposta"}
        </Button>
        <Button variant="secondary" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
