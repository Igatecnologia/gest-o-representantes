"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label, Select } from "@/components/ui";
import type { Product } from "@/lib/db/schema";

type ActionResult = { error?: string } | undefined;
type ActionFn = (prev: ActionResult, formData: FormData) => Promise<ActionResult>;

export function ProductForm({
  action,
  initial,
  submitLabel,
}: {
  action: ActionFn;
  initial?: Product;
  submitLabel: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    action,
    undefined
  );

  return (
    <Card className="max-w-2xl">
      <form action={formAction} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label htmlFor="name">Nome do produto *</Label>
          <Input id="name" name="name" required defaultValue={initial?.name ?? ""} />
        </div>

        <div>
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" name="sku" defaultValue={initial?.sku ?? ""} />
        </div>

        <div>
          <Label htmlFor="price">Mensalidade / Valor base (R$) *</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={initial ? initial.price / 100 : ""}
          />
        </div>

        <div>
          <Label htmlFor="implementationPrice">Implantação (R$)</Label>
          <Input
            id="implementationPrice"
            name="implementationPrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={initial ? initial.implementationPrice / 100 : "0"}
          />
        </div>

        <div>
          <Label htmlFor="type">Tipo *</Label>
          <Select
            id="type"
            name="type"
            defaultValue={initial?.type ?? "perpetual"}
            required
          >
            <option value="perpetual">Perpétua</option>
            <option value="subscription_monthly">Assinatura mensal</option>
            <option value="subscription_yearly">Assinatura anual</option>
          </Select>
        </div>

        <div className="flex items-end">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="active"
              defaultChecked={initial?.active ?? true}
              className="h-4 w-4 accent-[var(--color-primary)]"
            />
            Ativo
          </label>
        </div>

        {state?.error && (
          <p className="md:col-span-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {state.error}
          </p>
        )}

        <div className="md:col-span-2 mt-2 flex gap-2 border-t border-[var(--color-border)] pt-5">
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : submitLabel}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
