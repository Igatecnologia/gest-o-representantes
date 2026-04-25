import Link from "next/link";
import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";
import { Users, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { Button, PageHeader } from "@/components/ui";
import { RepList } from "./client";

export const dynamic = "force-dynamic";

export default async function RepsPage() {
  await requireAdmin();
  const reps = await db
    .select({
      id: schema.representatives.id,
      name: schema.representatives.name,
      email: schema.representatives.email,
      phone: schema.representatives.phone,
      commissionPct: schema.representatives.commissionPct,
      active: schema.representatives.active,
    })
    .from(schema.representatives)
    .orderBy(desc(schema.representatives.createdAt));

  return (
    <>
      <PageHeader
        title="Representantes"
        description={`${reps.length} representante(s) na equipe`}
        icon={Users}
        actions={
          <Link href="/representantes/novo">
            <Button>
              <Plus className="h-4 w-4" />
              Novo representante
            </Button>
          </Link>
        }
      />
      <RepList reps={reps} />
    </>
  );
}
