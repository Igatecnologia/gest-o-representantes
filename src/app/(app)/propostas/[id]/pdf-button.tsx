"use client";

import { useState } from "react";
import { toast } from "sonner";
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

function buildWhatsAppText(
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
  if (proposal.validUntil) lines.push(`*Valida ate:* ${proposal.validUntil}`);
  lines.push("");
  lines.push("*Itens:*");
  for (const item of items) {
    lines.push(`  - ${item.label} (${typeLabel(item.type)}): ${brlFormat(item.value)}`);
  }
  lines.push("");
  if (totals.oneTime > 0) lines.push(`*Implantacao:* ${brlFormat(totals.oneTime)}`);
  if (totals.monthly > 0) lines.push(`*Mensalidade:* ${brlFormat(totals.monthly)}`);
  if (totals.yearly > 0) lines.push(`*Anual:* ${brlFormat(totals.yearly)}`);
  lines.push("");
  lines.push(`*Representante:* ${proposal.repName}`);
  if (proposal.repPhone) lines.push(`*Contato:* ${proposal.repPhone}`);
  lines.push("");
  lines.push("_Segue proposta em PDF anexo_");
  return lines.join("\n");
}

async function generatePdfBlob(
  proposal: ProposalShareProps["proposal"],
  items: ProposalShareProps["items"],
  totals: ProposalShareProps["totals"]
) {
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
  const blob = doc.output("blob");

  return { blob, fileName, doc };
}

export function PdfButton({ proposal, items, totals }: ProposalShareProps) {
  const [loading, setLoading] = useState(false);
  const [whatsLoading, setWhatsLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const { doc, fileName } = await generatePdfBlob(proposal, items, totals);
      doc.save(fileName);
      toast.success("PDF gerado com sucesso");
    } catch {
      toast.error("Erro ao gerar PDF");
    } finally {
      setLoading(false);
    }
  }

  async function handleWhatsApp() {
    setWhatsLoading(true);
    try {
      const { blob, fileName } = await generatePdfBlob(proposal, items, totals);
      const file = new File([blob], fileName, { type: "application/pdf" });
      const message = buildWhatsAppText(proposal, items, totals);

      // Tenta compartilhar com arquivo (mobile)
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `Proposta - ${proposal.customerName}`,
          text: message,
          files: [file],
        });
        toast.success("Proposta compartilhada");
        return;
      }

      // Fallback: baixa PDF + abre WhatsApp com texto
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      // Abre WhatsApp com mensagem de texto
      const phone = proposal.customerPhone?.replace(/\D/g, "") ?? "";
      const fullPhone = phone.length >= 10 ? `55${phone.replace(/^55/, "")}` : "";
      const encoded = encodeURIComponent(message);
      const waUrl = fullPhone
        ? `https://wa.me/${fullPhone}?text=${encoded}`
        : `https://wa.me/?text=${encoded}`;

      window.open(waUrl, "_blank", "noopener,noreferrer");
      toast.success("PDF baixado — anexe no WhatsApp");
    } catch (err) {
      // Cancelamento do share nao e erro
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error("Erro ao compartilhar");
    } finally {
      setWhatsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleDownload}
        disabled={loading || whatsLoading}
        variant="secondary"
        size="sm"
        className="w-full"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        {loading ? "Gerando..." : "Baixar PDF"}
      </Button>

      <Button
        onClick={handleWhatsApp}
        disabled={loading || whatsLoading}
        variant="secondary"
        size="sm"
        className="w-full text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/30"
      >
        {whatsLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <MessageCircle className="h-3.5 w-3.5" />
        )}
        {whatsLoading ? "Preparando..." : "Enviar PDF via WhatsApp"}
      </Button>
    </div>
  );
}
