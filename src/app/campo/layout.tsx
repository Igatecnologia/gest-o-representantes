import { requireUser } from "@/lib/auth";

export default async function FieldLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {children}
    </div>
  );
}
