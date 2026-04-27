import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { CommandPalette } from "@/components/command-palette";
import { BackToTop } from "@/components/back-to-top";
import { requireUser } from "@/lib/auth";
import { getTodayFollowUpCount } from "@/lib/actions/follow-ups";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  // Graceful: se tabela follow_ups não existir ainda, retorna 0
  const followUpCount = await getTodayFollowUpCount().catch(() => 0);
  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <Sidebar userName={user.name} role={user.role} followUpCount={followUpCount} />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-4 pb-20 md:px-8 md:py-8 md:pb-8">{children}</main>
      </div>
      <CommandPalette role={user.role} />
      <BackToTop />
    </div>
  );
}
