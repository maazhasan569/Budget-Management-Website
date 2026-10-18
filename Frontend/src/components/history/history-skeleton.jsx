import { LoadingSkeletonTheme, Skeleton } from "@/components/ui/loading-skeleton-theme"

export function HistorySkeleton() {
  return (
    <LoadingSkeletonTheme>
      <div className="mx-auto max-w-7xl space-y-7" aria-label="Loading history" aria-busy="true">
        <header className="space-y-2">
          <Skeleton height={38} width={180} />
          <Skeleton height={16} width={360} />
        </header>
        <section className="rounded-2xl border border-border bg-card">
          <div className="border-b border-border/70 p-5">
            <Skeleton height={20} width={160} />
            <Skeleton className="mt-2" height={14} width={230} />
          </div>
          <div className="divide-y divide-border/70 px-5">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="flex items-center justify-between gap-4 py-5">
                <div className="flex min-w-0 items-center gap-3">
                  <Skeleton circle width={40} height={40} />
                  <div className="min-w-0 space-y-2">
                    <Skeleton height={16} width={180} />
                    <Skeleton height={13} width={250} />
                  </div>
                </div>
                <Skeleton height={20} width={90} />
              </div>
            ))}
          </div>
          <div className="flex justify-between border-t border-border/70 p-5">
            <Skeleton height={14} width={145} />
            <Skeleton height={32} width={150} borderRadius={8} />
          </div>
        </section>
      </div>
    </LoadingSkeletonTheme>
  )
}
