export default function AppLoading() {
  return (
    <div className="animate-pulse space-y-6 p-1">
      {/* Page header skeleton */}
      <div className="space-y-2">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-4 w-72" />
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
          >
            <div className="skeleton mb-3 h-3 w-24" />
            <div className="skeleton h-7 w-32" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="skeleton mb-4 h-5 w-40" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-4 flex-1" />
              <div className="skeleton h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
