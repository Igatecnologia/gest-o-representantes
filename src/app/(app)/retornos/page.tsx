import Link from "next/link";
import { getFollowUps, getFollowUpCounts } from "@/lib/actions/follow-ups";
import { Button, PageHeader } from "@/components/ui";
import { CalendarClock, Plus } from "lucide-react";
import { FollowUpList } from "./client";

export const dynamic = "force-dynamic";

type Filter = "today" | "week" | "month" | "overdue" | "all";
type StatusFilter = "pending" | "done" | "skipped" | "all";

export default async function RetornosPage({
  searchParams,
}: {
  searchParams: Promise<{
    filter?: string;
    status?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const params = await searchParams;
  const activeFilter = (params.filter as Filter) || "all";
  const status = (params.status as StatusFilter) || "pending";
  const from = params.from || "";
  const to = params.to || "";

  const [followUps, counts] = await Promise.all([
    getFollowUps(activeFilter, { status, from, to }),
    getFollowUpCounts(),
  ]);

  return (
    <>
      <PageHeader
        title="Retornos"
        description="Acompanhe seus retornos agendados com clientes"
        icon={CalendarClock}
        actions={
          <Link href="/retornos/novo">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Novo retorno
            </Button>
          </Link>
        }
      />
      <FollowUpList
        followUps={followUps}
        counts={counts}
        activeFilter={activeFilter}
        status={status}
        from={from}
        to={to}
      />
    </>
  );
}
