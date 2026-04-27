import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ProposalPdfData {
  proposalId: string;
  createdAt: string;
  validUntil?: string;
  notes?: string;
  customer: {
    name: string;
    email?: string;
    phone?: string;
    document?: string;
    address?: string;
  };
  representative: {
    name: string;
    email?: string;
    phone?: string;
  };
  product: string;
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
  logoBase64?: string;
}

function brlPdf(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function typeLabel(type: string): string {
  switch (type) {
    case "one_time":
      return "Implantacao";
    case "monthly":
      return "Mensal";
    case "yearly":
      return "Anual";
    default:
      return type;
  }
}

// Brand colors — IGA identity
const BRAND_BLUE = [46, 109, 180] as const; // #2e6db4
const BRAND_DARK = [8, 20, 34] as const; // #081422
const BRAND_VIOLET = [27, 79, 138] as const; // #1b4f8a
const TEXT_DARK = [15, 23, 42] as const;
const TEXT_MUTED = [100, 116, 139] as const;
const WHITE = [255, 255, 255] as const;
const LIGHT_BG = [248, 250, 252] as const;
const BORDER = [226, 232, 240] as const;

export function generateProposalPdf(data: ProposalPdfData): jsPDF {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  // =================== HEADER BAR ===================
  doc.setFillColor(...BRAND_DARK);
  doc.rect(0, 0, pageWidth, 52, "F");

  // Accent gradient bar at top
  doc.setFillColor(...BRAND_BLUE);
  doc.rect(0, 0, pageWidth, 3, "F");

  // Logo
  if (data.logoBase64) {
    try {
      doc.addImage(data.logoBase64, "PNG", margin, 10, 28, 28);
    } catch {
      // fallback: draw a blue square
      doc.setFillColor(...BRAND_BLUE);
      doc.roundedRect(margin, 10, 28, 28, 4, 4, "F");
      doc.setTextColor(...WHITE);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("IGA", margin + 14, 27, { align: "center" });
    }
  } else {
    doc.setFillColor(...BRAND_BLUE);
    doc.roundedRect(margin, 10, 28, 28, 4, 4, "F");
    doc.setTextColor(...WHITE);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("IGA", margin + 14, 27, { align: "center" });
  }

  // Company name
  doc.setTextColor(...WHITE);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("IGA", margin + 34, 22);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 200, 240);
  doc.text("IGA Sistema de Gerenciamento Comercial", margin + 34, 30);

  // Proposal label on right
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  doc.text("PROPOSTA COMERCIAL", pageWidth - margin, 20, { align: "right" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(160, 180, 220);
  doc.text(`#${data.proposalId.toUpperCase().slice(0, 8)}`, pageWidth - margin, 28, { align: "right" });
  doc.text(`Emitida em ${data.createdAt}`, pageWidth - margin, 34, { align: "right" });

  y = 62;

  // =================== CLIENT & REP INFO ===================
  const boxWidth = (contentWidth - 6) / 2;

  // Client box
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(margin, y, boxWidth, 44, 3, 3, "F");
  doc.setDrawColor(...BORDER);
  doc.roundedRect(margin, y, boxWidth, 44, 3, 3, "S");

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_BLUE);
  doc.text("CLIENTE", margin + 5, y + 8);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEXT_DARK);
  doc.text(data.customer.name, margin + 5, y + 16);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT_MUTED);
  let infoY = y + 23;
  if (data.customer.document) {
    doc.text(`CNPJ/CPF: ${data.customer.document}`, margin + 5, infoY);
    infoY += 5;
  }
  if (data.customer.email) {
    doc.text(data.customer.email, margin + 5, infoY);
    infoY += 5;
  }
  if (data.customer.phone) {
    doc.text(data.customer.phone, margin + 5, infoY);
  }

  // Rep box
  const repX = margin + boxWidth + 6;
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(repX, y, boxWidth, 44, 3, 3, "F");
  doc.setDrawColor(...BORDER);
  doc.roundedRect(repX, y, boxWidth, 44, 3, 3, "S");

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_BLUE);
  doc.text("REPRESENTANTE", repX + 5, y + 8);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEXT_DARK);
  doc.text(data.representative.name, repX + 5, y + 16);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT_MUTED);
  infoY = y + 23;
  if (data.representative.email) {
    doc.text(data.representative.email, repX + 5, infoY);
    infoY += 5;
  }
  if (data.representative.phone) {
    doc.text(data.representative.phone, repX + 5, infoY);
    infoY += 5;
  }
  doc.text(`Sistema: ${data.product}`, repX + 5, infoY);

  y += 54;

  // =================== ITEMS TABLE ===================
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_BLUE);
  doc.text("ITENS DA PROPOSTA", margin, y + 2);
  y += 6;

  const tableBody = data.items.map((item) => {
    const diff = item.value !== item.defaultValue && item.defaultValue > 0;
    return [
      item.label,
      typeLabel(item.type),
      item.defaultValue > 0 ? brlPdf(item.defaultValue) : "-",
      brlPdf(item.value),
      diff ? brlPdf(item.value - item.defaultValue) : "-",
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Item", "Tipo", "Valor Padrao", "Valor Proposto", "Diferenca"]],
    body: tableBody,
    theme: "plain",
    headStyles: {
      fillColor: [...BRAND_DARK] as [number, number, number],
      textColor: [...WHITE] as [number, number, number],
      fontSize: 8,
      fontStyle: "bold",
      cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [...TEXT_DARK] as [number, number, number],
      cellPadding: { top: 3.5, bottom: 3.5, left: 5, right: 5 },
    },
    alternateRowStyles: {
      fillColor: [...LIGHT_BG] as [number, number, number],
    },
    columnStyles: {
      0: { cellWidth: "auto", fontStyle: "bold" },
      1: { cellWidth: 25, halign: "center" },
      2: { cellWidth: 30, halign: "right" },
      3: { cellWidth: 30, halign: "right", fontStyle: "bold" },
      4: { cellWidth: 28, halign: "right" },
    },
    didParseCell: (hookData) => {
      // Color the "Diferenca" column
      if (hookData.section === "body" && hookData.column.index === 4) {
        const val = hookData.cell.raw as string;
        if (val && val !== "-") {
          hookData.cell.styles.textColor = val.includes("-")
            ? [239, 68, 68] // red
            : [16, 185, 129]; // green
        }
      }
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 10;

  // =================== FINANCIAL SUMMARY ===================
  const summaryWidth = 80;
  const summaryX = pageWidth - margin - summaryWidth;

  // Background for summary
  doc.setFillColor(...BRAND_DARK);
  doc.roundedRect(summaryX, y, summaryWidth, 52, 3, 3, "F");

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(160, 180, 220);
  doc.text("RESUMO FINANCEIRO", summaryX + 6, y + 8);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 210, 230);

  let summaryY = y + 16;

  if (data.totals.oneTime > 0) {
    doc.text("Implantacao:", summaryX + 6, summaryY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...WHITE);
    doc.text(brlPdf(data.totals.oneTime), summaryX + summaryWidth - 6, summaryY, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 210, 230);
    summaryY += 7;
  }

  if (data.totals.monthly > 0) {
    doc.text("Mensalidade:", summaryX + 6, summaryY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(59, 130, 246); // blue highlight
    doc.text(brlPdf(data.totals.monthly), summaryX + summaryWidth - 6, summaryY, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 210, 230);
    summaryY += 7;
  }

  if (data.totals.yearly > 0) {
    doc.text("Anual:", summaryX + 6, summaryY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...WHITE);
    doc.text(brlPdf(data.totals.yearly), summaryX + summaryWidth - 6, summaryY, { align: "right" });
    summaryY += 7;
  }

  // Total line
  doc.setDrawColor(60, 80, 120);
  doc.line(summaryX + 6, summaryY, summaryX + summaryWidth - 6, summaryY);
  summaryY += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  const grandTotal = data.totals.oneTime + data.totals.monthly + data.totals.yearly;
  doc.text("Total:", summaryX + 6, summaryY);
  doc.text(brlPdf(grandTotal), summaryX + summaryWidth - 6, summaryY, { align: "right" });

  // Validity on the left
  if (data.validUntil) {
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(margin, y, summaryX - margin - 8, 24, 3, 3, "F");
    doc.setDrawColor(...BORDER);
    doc.roundedRect(margin, y, summaryX - margin - 8, 24, 3, 3, "S");

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND_BLUE);
    doc.text("VALIDADE", margin + 5, y + 8);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEXT_DARK);
    doc.text(`Valida ate ${data.validUntil}`, margin + 5, y + 17);
  }

  y += 62;

  // =================== NOTES ===================
  if (data.notes) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND_BLUE);
    doc.text("OBSERVACOES", margin, y);
    y += 5;

    doc.setFillColor(...LIGHT_BG);
    const notesLines = doc.splitTextToSize(data.notes, contentWidth - 10);
    const notesHeight = Math.max(notesLines.length * 4.5 + 10, 18);
    doc.roundedRect(margin, y, contentWidth, notesHeight, 3, 3, "F");
    doc.setDrawColor(...BORDER);
    doc.roundedRect(margin, y, contentWidth, notesHeight, 3, 3, "S");

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_MUTED);
    doc.text(notesLines, margin + 5, y + 7);
    y += notesHeight + 10;
  }

  // =================== SIGNATURE AREA ===================
  if (y > pageHeight - 60) {
    doc.addPage();
    y = 30;
  }

  y = Math.max(y, pageHeight - 55);

  doc.setDrawColor(...BORDER);
  // Client signature
  doc.line(margin, y + 15, margin + 70, y + 15);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT_MUTED);
  doc.text("Assinatura do Cliente", margin, y + 21);
  doc.setFontSize(7);
  doc.text(data.customer.name, margin, y + 26);

  // Rep signature
  doc.line(pageWidth - margin - 70, y + 15, pageWidth - margin, y + 15);
  doc.text("Assinatura do Representante", pageWidth - margin - 70, y + 21);
  doc.setFontSize(7);
  doc.text(data.representative.name, pageWidth - margin - 70, y + 26);

  // =================== FOOTER ===================
  doc.setFillColor(...BRAND_DARK);
  doc.rect(0, pageHeight - 14, pageWidth, 14, "F");

  doc.setFillColor(...BRAND_BLUE);
  doc.rect(0, pageHeight - 14, pageWidth, 1.5, "F");

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(140, 160, 200);
  doc.text(
    "IGA - Sistema de Gerenciamento Comercial | Documento gerado automaticamente",
    pageWidth / 2,
    pageHeight - 5,
    { align: "center" }
  );

  return doc;
}
