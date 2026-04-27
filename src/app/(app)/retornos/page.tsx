import Link from "next/link";
import { getFollowUps, getFollowUpCounts } from "@/lib/actions/follow-ups";
import { requireScope } from "@/lib/auth";
import { Button, PageHeader } from "@/components/ui";
import { CalendarClock, Plus } from "lucide-react";
import { FollowUpList } from "./client";

export const dynamic = "force-dynamic";

export default async function RetornosPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const activeFilter = (filter as "today" | "week" | "month" | "overdue" | "all") || "today";

  const [followUps, counts] = await Promise.all([
    getFollowUps(activeFilter),
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
      />
    </>
  );
}
