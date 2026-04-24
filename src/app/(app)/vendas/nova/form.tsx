"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui";
import { createSaleAction } from "@/lib/actions/sales";
import { brl } from "@/lib/utils";

type RepOpt = { id: string; name: string; commissionPct: number };
type NamedOpt = { id: string; name: string };
type ProductOpt = { id: string; name: string; price: number };

const initial: { error?: string } = {};

export function SaleForm({
  reps,
  customers,
  products,
  isAdmin = true,
}: {
  reps: RepOpt[];
  customers: NamedOpt[];
  products: ProductOpt[];
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(createSaleAction, initial);

  const [repId, setRepId] = useState(reps[0]?.id ?? "");
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [unitPrice, setUnitPrice] = useState<number>(products[0]?.price ?? 0);
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);

  const rep = useMemo(() => reps.find((r) => r.id === repId), [repId, reps]);

  const total = Math.max(0, quantity * unitPrice - discount);
  const commission = rep ? (total * rep.commissionPct) / 100 : 0;

  const missingDeps =
    reps.length === 0 || customers.length === 0 || products.length === 0;

  if (missingDeps) {
    return (
      <Card className="max-w-2xl">
        <p className="text-sm">
          Cadastre pelo menos um <strong>representante ativo</strong>, um{" "}
          <strong>cliente</strong> e um <strong>produto ativo</strong> antes de
          registrar uma venda.
        </p>
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl">
      <form action={action} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {isAdmin ? (
          <div>
            <Label htmlFor="representativeId">Representante *</Label>
            <Select
              id="representativeId"
              name="representativeId"
              required
              value={repId}
              onChange={(e) => setRepId(e.target.value)}
            >
              {reps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.commissionPct.toFixed(2)}%)
                </option>
              ))}
            </Select>
          </div>
        ) : (
          // Rep: hidden + display do próprio
          <div>
            <Label>Representante</Label>
            <div className="flex h-9 items-center rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 text-sm text-[var(--color-text-muted)]">
              {rep?.name ?? "—"} ({rep?.commissionPct.toFixed(2) ?? 0}%)
            </div>
            <input type="hidden" name="representativeId" value={repId} />
          </div>
        )}

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

        <div>
          <Label htmlFor="productId">Produto *</Label>
          <Select
            id="productId"
            name="productId"
            required
            value={productId}
            onChange={(e) => {
              const id = e.target.value;
              setProductId(id);
              const p = products.find((x) => x.id === id);
              if (p) setUnitPrice(p.price);
            }}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {brl(p.price)}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="quantity">Quantidade *</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            min="1"
            step="1"
            required
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value) || 1)}
          />
        </div>

        <div>
          <Label htmlFor="unitPrice">Preço unitário (R$) *</Label>
          <Input
            id="unitPrice"
            name="unitPrice"
            type="number"
            step="0.01"
            min="0"
            required
            value={unitPrice}
            onChange={(e) => setUnitPrice(Number(e.target.value) || 0)}
          />
        </div>

        <div>
          <Label htmlFor="discount">Desconto (R$)</Label>
          <Input
            id="discount"
            name="discount"
            type="number"
            step="0.01"
            min="0"
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value) || 0)}
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="notes">Observações</Label>
          <Textarea id="notes" name="notes" rows={3} />
        </div>

        <div className="md:col-span-2 grid grid-cols-2 gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)]/50 px-4 py-3">
          <div>
            <div className="text-xs text-[var(--color-muted)]">Total da venda</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{brl(total)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[var(--color-muted)]">
              Comissão estimada ({rep?.commissionPct.toFixed(2) ?? 0}%)
            </div>
            <div className="mt-1 text-xl font-semibold tabular-nums text-emerald-400">
              {brl(commission)}
            </div>
          </div>
        </div>

        {state.error && (
          <p className="md:col-span-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {state.error}
          </p>
        )}

        <div className="md:col-span-2 mt-2 flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Registrando..." : "Registrar venda"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
