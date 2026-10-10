import { LoadingSkeletonTheme, Skeleton } from "@/components/ui/loading-skeleton-theme"

export function ExpensesSkeleton() {
  return (
    <LoadingSkeletonTheme>
      <div className="mx-auto max-w-7xl space-y-7" aria-label="Loading expenses" aria-busy="true">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton height={14} width={118} />
            <Skeleton height={38} width={210} />
            <Skeleton height={16} width={320} />
          </div>
          <Skeleton height={40} width={136} borderRadius={10} />
        </header>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex flex-wrap gap-3">
            <Skeleton height={40} width={240} borderRadius={10} />
            <Skeleton height={40} width={220} borderRadius={10} />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="grid gap-3 rounded-xl border border-border/70 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-5">
                <div className="flex min-w-0 items-center gap-3">
                  <Skeleton circle width={40} height={40} />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton height={16} width="42%" />
                    <Skeleton height={13} width="28%" />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <Skeleton height={24} width={92} borderRadius={999} />
                  <Skeleton height={18} width={68} />
                </div>
                <div className="flex justify-end gap-2">
                  <Skeleton height={32} width={32} borderRadius={8} />
                  <Skeleton height={32} width={32} borderRadius={8} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </LoadingSkeletonTheme>
  )
}

