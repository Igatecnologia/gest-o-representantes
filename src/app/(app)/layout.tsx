import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { CommandPalette } from "@/components/command-palette";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return (
    <div className="flex min-h-screen bg-[var(--color-bg)] bg-mesh-live">
      <Sidebar userName={user.name} role={user.role} />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-4 pb-20 md:px-8 md:py-8 md:pb-8">{children}</main>
      </div>
      <CommandPalette role={user.role} />
    </div>
  );
}
