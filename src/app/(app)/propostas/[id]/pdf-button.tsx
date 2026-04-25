"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { Download, Loader2, MessageCircle } from "lucide-react";

interface ProposalShareProps {
  proposal: {
    id: string;
    createdAt: string;
    validUntil?: string;
    notes?: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    customerDocument?: string;
    customerAddress?: string;
    repName: string;
    repEmail?: string;
    repPhone?: string;
    productName: string;
  };
  items: {
    label: string;
    type: "one_time" | "monthly" | "yearly";
    defaultValue: number;
    value: number;
  }[];
  totals: {
    oneTime: number;
    monthly: number;
    yearly: number;
  };
}

function brlFormat(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function typeLabel(type: string): string {
  switch (type) {
    case "one_time": return "Unico";
    case "monthly": return "Mensal";
    case "yearly": return "Anual";
    default: return type;
  }
}

async function loadLogoAsBase64(): Promise<string | undefined> {
  try {
    const res = await fetch("/logo-iga.png");
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

function buildWhatsAppMessage(
  proposal: ProposalShareProps["proposal"],
  items: ProposalShareProps["items"],
  totals: ProposalShareProps["totals"]
): string {
  const lines: string[] = [];

  lines.push("*IGA - Proposta Comercial*");
  lines.push("");
  lines.push(`*Cliente:* ${proposal.customerName}`);
  lines.push(`*Sistema:* ${proposal.productName}`);
  lines.push(`*Data:* ${proposal.createdAt}`);
  if (proposal.validUntil) {
    lines.push(`*Valida ate:* ${proposal.validUntil}`);
  }
  lines.push("");
  lines.push("*Itens:*");

  for (const item of items) {
    lines.push(`  - ${item.label} (${typeLabel(item.type)}): ${brlFormat(item.value)}`);
  }

  lines.push("");
  lines.push("*Resumo Financeiro:*");

  if (totals.oneTime > 0) {
    lines.push(`  Implantacao: ${brlFormat(totals.oneTime)}`);
  }
  if (totals.monthly > 0) {
    lines.push(`  Mensalidade: ${brlFormat(totals.monthly)}`);
  }
  if (totals.yearly > 0) {
    lines.push(`  Anual: ${brlFormat(totals.yearly)}`);
  }

  lines.push("");
  lines.push(`*Representante:* ${proposal.repName}`);
  if (proposal.repPhone) {
    lines.push(`*Contato:* ${proposal.repPhone}`);
  }

  if (proposal.notes) {
    lines.push("");
    lines.push(`*Obs:* ${proposal.notes}`);
  }

  lines.push("");
  lines.push("_Proposta gerada pelo sistema IGA_");

  return lines.join("\n");
}

export function PdfButton({ proposal, items, totals }: ProposalShareProps) {
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const [logoBase64, { generateProposalPdf }] = await Promise.all([
        loadLogoAsBase64(),
        import("@/lib/generate-proposal-pdf"),
      ]);

      const doc = generateProposalPdf({
        proposalId: proposal.id,
        createdAt: proposal.createdAt,
        validUntil: proposal.validUntil,
        notes: proposal.notes,
        customer: {
          name: proposal.customerName,
          email: proposal.customerEmail,
          phone: proposal.customerPhone,
          document: proposal.customerDocument,
          address: proposal.customerAddress,
        },
        representative: {
          name: proposal.repName,
          email: proposal.repEmail,
          phone: proposal.repPhone,
        },
        product: proposal.productName,
        items,
        totals,
        logoBase64,
      });

      const fileName = `proposta-${proposal.customerName.replace(/\s+/g, "-").toLowerCase()}-${proposal.id.slice(0, 8)}.pdf`;
      doc.save(fileName);
    } finally {
      setLoading(false);
    }
  }

  function handleWhatsApp() {
    const message = buildWhatsAppMessage(proposal, items, totals);
    const encoded = encodeURIComponent(message);

    // Se o cliente tem telefone, abre direto para ele
    const phone = proposal.customerPhone?.replace(/\D/g, "") ?? "";
    const fullPhone = phone.length >= 10
      ? `55${phone.replace(/^55/, "")}` // garante DDI Brasil
      : "";

    const url = fullPhone
      ? `https://wa.me/${fullPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleGenerate}
        disabled={loading}
        variant="secondary"
        size="sm"
        className="w-full"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        {loading ? "Gerando PDF..." : "Gerar PDF"}
      </Button>

      <Button
        onClick={handleWhatsApp}
        variant="secondary"
        size="sm"
        className="w-full text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/30"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        Enviar via WhatsApp
      </Button>
    </div>
  );
}
