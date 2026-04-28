"use client";

import { Button } from "@/components/ui";
import { MessageSquare } from "lucide-react";
import { TemplatePicker } from "./template-picker";
import { whatsappUrl } from "@/lib/utils";
import { toast } from "sonner";

/**
 * Botão de WhatsApp com seletor de template.
 * - Click direto → abre wa.me com mensagem padrão
 * - Botão "Templates" ao lado → escolhe template e abre wa.me com mensagem
 *   substituída.
 */
export function WhatsAppButton({
  phone,
  customerName,
  productName,
  representativeName,
  defaultMessage,
}: {
  phone: string | null;
  customerName: string;
  productName?: string;
  representativeName?: string;
  defaultMessage?: string;
}) {
  const hasPhone = !!phone;
  const fallbackMsg =
    defaultMessage ??
    `Olá ${customerName.split(" ")[0]}! Tudo bem? Estou entrando em contato pra conversar.`;

  function open(text: string) {
    if (!hasPhone) {
      toast.error("Cliente sem telefone cadastrado");
      return;
    }
    window.open(whatsappUrl(phone, text), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="secondary"
        onClick={() => open(fallbackMsg)}
        disabled={!hasPhone}
        title={hasPhone ? "Enviar WhatsApp" : "Cliente sem telefone"}
        className="bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border-[#25D366]/30"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        WhatsApp
      </Button>

      <TemplatePicker
        category="whatsapp"
        vars={{
          nome: customerName,
          produto: productName,
          representante: representativeName,
        }}
        onSelect={open}
        buttonLabel="Templates"
      />
    </div>
  );
}
