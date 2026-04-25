"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { Download, Loader2 } from "lucide-react";
import { generateProposalPdf } from "@/lib/generate-proposal-pdf";

interface PdfButtonProps {
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

export function PdfButton({ proposal, items, totals }: PdfButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const logoBase64 = await loadLogoAsBase64();

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

  return (
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
  );
}
