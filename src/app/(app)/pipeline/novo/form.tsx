"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label, Select, Textarea } from "@/components/ui";
import { createDealAction } from "@/lib/actions/deals";
import { DEAL_STAGES } from "@/lib/db/schema";

type Opt = { id: string; name: string };
type ProdOpt = { id: string; name: string; price: number };

const initial: { error?: string } = {};

export function NewDealForm({
  reps,
  customers,
  products,
  isAdmin = true,
}: {
  reps: Opt[];
  customers: Opt[];
  products: ProdOpt[];
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(createDealAction, initial);
  const [productId, setProductId] = useState("");
  const [value, setValue] = useState(0);

  if (reps.length === 0 || customers.length === 0) {
    return (
      <Card className="max-w-2xl">
        <p className="text-sm">
          Cadastre pelo menos um <strong>representante ativo</strong> e um{" "}
          <strong>cliente</strong> antes de criar um negócio.
        </p>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl">
      <form action={action} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label htmlFor="title">Título do negócio *</Label>
          <Input
            id="title"
            name="title"
            required
            placeholder="Ex: Licença ACME para 20 usuários"
          />
        </div>

        <div>
          <Label htmlFor="customerId">Cliente *</Label>
          <Select id="customerId" name="customerId" required>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        {isAdmin ? (
          <div>
            <Label htmlFor="representativeId">Representante *</Label>
            <Select id="representativeId" name="representativeId" required>
              {reps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </div>
        ) : (
          <div>
            <Label>Representante</Label>
            <div className="flex h-9 items-center rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 text-sm text-[var(--color-text-muted)]">
              {reps[0]?.name ?? "—"}
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="productId">Produto (opcional)</Label>
          <Select
            id="productId"
            name="productId"
            value={productId}
            onChange={(e) => {
              const id = e.target.value;
              setProductId(id);
              const p = products.find((x) => x.id === id);
              if (p) setValue(p.price / 100);
            }}
          >
            <option value="">— nenhum —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="value">Valor (R$) *</Label>
          <Input
            id="value"
            name="value"
            type="number"
            step="0.01"
            min="0"
            required
            value={value}
            onChange={(e) => setValue(Number(e.target.value) || 0)}
          />
        </div>

        <div>
          <Label htmlFor="stage">Estágio</Label>
          <Select id="stage" name="stage" defaultValue="lead">
            {DEAL_STAGES.filter((s) => s.id !== "won" && s.id !== "lost").map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="expectedCloseDate">Previsão de fechamento</Label>
          <Input id="expectedCloseDate" name="expectedCloseDate" type="date" />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="notes">Observações</Label>
          <Textarea id="notes" name="notes" rows={3} />
        </div>

        {state.error && (
          <p className="md:col-span-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {state.error}
          </p>
        )}

        <div className="md:col-span-2 mt-2 flex gap-2 border-t border-[var(--color-border)] pt-5">
          <Button type="submit" disabled={pending}>
            {pending ? "Criando..." : "Criar negócio"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
