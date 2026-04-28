"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  MapPin,
  Eye,
  Trash2,
  Phone,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import { SwipeableCard } from "@/components/swipeable-card";
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  SearchInput,
  Pagination,
  Table,
  THead,
  TH,
  TR,
  TD,
  ConfirmDialog,
} from "@/components/ui";
import { whatsappUrl } from "@/lib/utils";
import { deleteCustomerAction } from "@/lib/actions/customers";
import { useCustomerCardFields } from "@/lib/use-card-fields";

type CustomerRow = {
  id: string;
  name: string;
  tradeName: string | null;
  document: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  repName: string | null;
};

const PER_PAGE = 20;

export function CustomerList({
  customers,
  isAdmin,
  total,
  page,
  search,
}: {
  customers: CustomerRow[];
  isAdmin: boolean;
  total: number;
  page: number;
  search: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [cardFields] = useCustomerCardFields();

  function navigate(newPage: number, newSearch?: string) {
    const s = newSearch ?? search;
    const params = new URLSearchParams();
    if (s) params.set("q", s);
    if (newPage > 1) params.set("page", String(newPage));
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  }

  function handleSearch(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => navigate(1, value), 300);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const fd = new FormData();
    fd.set("id", deleteId);
    const result = await deleteCustomerAction(fd);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Cliente excluído com sucesso");
    }
    setDeleteId(null);
    setDeleting(false);
  }

  function openWhatsApp(c: CustomerRow, e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    const firstName = c.name.split(" ")[0];
    const message = `Olá ${firstName}! Tudo bem? Estou entrando em contato pra conversar sobre nossa solução.`;
    window.open(whatsappUrl(c.phone, message), "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <div className="mb-4">
        <SearchInput
          defaultValue={search}
          onChange={handleSearch}
          placeholder="Buscar por nome, CNPJ, cidade, e-mail..."
        />
      </div>

      {customers.length === 0 ? (
        <EmptyState
          title={search ? "Nenhum resultado" : "Nenhum cliente cadastrado"}
          hint={search ? `Nenhum cliente encontrado para "${search}"` : "Cadastre o primeiro cliente."}
          icon={Building2}
          action={
            !search ? (
              <Link href="/clientes/novo">
                <Button size="sm">Cadastrar cliente</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Mobile: cards limpos com swipe gestures */}
          <div className="space-y-2 md:hidden">
            {customers.map((c) => {
              const hasPhone = !!c.phone;
              const swipeRight: Parameters<typeof SwipeableCard>[0]["rightActions"] = [
                {
                  label: "Excluir",
                  icon: Trash2,
                  color: "bg-[var(--color-danger)]",
                  onAction: () => setDeleteId(c.id),
                },
              ];
              const swipeLeft: Parameters<typeof SwipeableCard>[0]["leftActions"] = hasPhone
                ? [
                    {
                      label: "WhatsApp",
                      icon: MessageSquare,
                      color: "bg-[#25D366]",
                      onAction: () => openWhatsApp(c),
                    },
                    {
                      label: "Ligar",
                      icon: Phone,
                      color: "bg-[var(--color-primary)]",
                      onAction: () => {
                        window.location.href = `tel:${c.phone}`;
                      },
                    },
                  ]
                : [];

              return (
                <SwipeableCard
                  key={c.id}
                  rightActions={swipeRight}
                  leftActions={swipeLeft}
                  className="rounded-[var(--radius-lg)]"
                >
                  <Link
                    href={`/clientes/${c.id}`}
                    className="relative block overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 active:scale-[0.99]"
                  >
                    {/* Topbar gradient */}
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)]" />

                    <div className="flex items-start gap-3 pt-1">
                      <Avatar name={c.name} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-[var(--color-text)]">
                          {c.name}
                        </div>
                        {c.tradeName && c.tradeName !== c.name && (
                          <div className="truncate text-xs text-[var(--color-text-muted)]">
                            {c.tradeName}
                          </div>
                        )}
                        {cardFields.has("document") && c.document && (
                          <div className="mt-0.5 font-mono text-[10px] text-[var(--color-text-dim)]">
                            {c.document}
                          </div>
                        )}

                        {/* Info compacta */}
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--color-text-muted)]">
                          {cardFields.has("city") && c.city && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {c.city}
                              {c.state ? `/${c.state}` : ""}
                            </span>
                          )}
                          {cardFields.has("phone") && c.phone && (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {c.phone}
                            </span>
                          )}
                          {cardFields.has("rep") && isAdmin && c.repName && (
                            <span className="inline-flex items-center gap-1">
                              <Avatar name={c.repName} size="sm" />
                              {c.repName}
                            </span>
                          )}
                          {cardFields.has("rep") && isAdmin && !c.repName && (
                            <Badge tone="warning">sem dono</Badge>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-text-dim)]" />
                    </div>
                  </Link>
                </SwipeableCard>
              );
            })}

            {/* Hint visual de swipe */}
            <p className="mt-3 text-center text-[10px] text-[var(--color-text-dim)]">
              💡 Arraste o card pra esquerda pra excluir, pra direita pro WhatsApp
            </p>
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block">
            <Table>
              <THead>
                <tr>
                  <TH>Cliente</TH>
                  <TH>CNPJ</TH>
                  {isAdmin && <TH>Representante</TH>}
                  <TH>Local</TH>
                  <TH>Contato</TH>
                  <TH className="text-right">Ações</TH>
                </tr>
              </THead>
              <tbody>
                {customers.map((c) => {
                  const hasPhone = !!c.phone;
                  return (
                    <TR key={c.id}>
                      <TD>
                        <Link
                          href={`/clientes/${c.id}`}
                          className="flex items-center gap-3 hover:opacity-80"
                        >
                          <Avatar name={c.name} size="sm" />
                          <div className="min-w-0">
                            <div className="truncate font-medium">{c.name}</div>
                            {c.tradeName && (
                              <div className="truncate text-xs text-[var(--color-text-muted)]">
                                {c.tradeName}
                              </div>
                            )}
                          </div>
                        </Link>
                      </TD>
                      <TD className="font-mono text-xs text-[var(--color-text-muted)]">
                        {c.document ?? "-"}
                      </TD>
                      {isAdmin && (
                        <TD>
                          {c.repName ? (
                            <div className="flex items-center gap-2">
                              <Avatar name={c.repName} size="sm" />
                              <span className="text-sm">{c.repName}</span>
                            </div>
                          ) : (
                            <Badge tone="warning">sem dono</Badge>
                          )}
                        </TD>
                      )}
                      <TD>
                        {c.city ? (
                          <div className="flex items-center gap-1.5 text-sm">
                            <MapPin className="h-3.5 w-3.5 text-[var(--color-text-dim)]" />
                            <span>
                              {c.city}
                              {c.state ? ` / ${c.state}` : ""}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[var(--color-text-dim)]">-</span>
                        )}
                      </TD>
                      <TD>
                        <div className="text-sm">{c.email ?? "-"}</div>
                        <div className="text-xs text-[var(--color-text-muted)]">
                          {c.phone ?? ""}
                        </div>
                      </TD>
                      <TD className="text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={(e) => openWhatsApp(c, e)}
                            disabled={!hasPhone}
                            title={hasPhone ? "Abrir WhatsApp" : "Cliente sem telefone"}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[#25D366] transition-colors hover:bg-[#25D366]/10 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </button>
                          <Link href={`/clientes/${c.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(c.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TD>
                    </TR>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </>
      )}

      <Pagination total={total} page={page} perPage={PER_PAGE} onChange={(p) => navigate(p)} />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir cliente?"
        description="Esta ação não pode ser desfeita. Todas as vendas e propostas vinculadas serão afetadas."
        confirmLabel="Excluir"
        danger
        loading={deleting}
      />
    </>
  );
}
