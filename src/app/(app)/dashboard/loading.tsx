export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="mb-8">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton mt-2 h-4 w-64" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
          >
            <div className="skeleton mb-3 h-3 w-28" />
            <div className="skeleton mb-2 h-7 w-36" />
            <div className="skeleton h-3 w-20" />
            <div className="skeleton mt-3 h-10 w-full" />
          </div>
        ))}
      </div>

      {/* Chart + sidebar */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 lg:col-span-2">
          <div className="skeleton mb-4 h-5 w-44" />
          <div className="skeleton h-64 w-full" />
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="skeleton mb-4 h-5 w-32" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]/40 px-3 py-3"
              >
                <div className="skeleton h-4 w-24" />
                <div className="skeleton h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent sales */}
      <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="skeleton mb-4 h-5 w-36" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="skeleton h-4 w-20" />
              <div className="skeleton h-4 w-32" />
              <div className="skeleton h-4 w-24" />
              <div className="skeleton ml-auto h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
