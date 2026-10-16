import { LoadingSkeletonTheme, Skeleton } from "@/components/ui/loading-skeleton-theme"

export function GoalsSkeleton() {
  return (
    <LoadingSkeletonTheme>
      <div className="mx-auto max-w-7xl space-y-7" aria-label="Loading goals" aria-busy="true">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton height={14} width={130} />
            <Skeleton height={38} width={180} />
            <Skeleton height={16} width={330} />
          </div>
          <Skeleton height={40} width={135} borderRadius={10} />
        </header>

        <section className="grid gap-3 sm:grid-cols-2">
          {[0, 1].map((item) => (
            <div key={item} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <Skeleton height={14} width={110} />
                  <Skeleton height={31} width={165} />
                </div>
                <Skeleton circle width={40} height={40} />
              </div>
              <Skeleton className="mt-4" height={12} width={140} />
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <Skeleton height={19} width={145} />
              <Skeleton height={13} width={205} />
            </div>
            <Skeleton height={34} width={180} borderRadius={10} />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="space-y-3 rounded-xl border border-border/70 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <Skeleton circle width={42} height={42} />
                    <div className="min-w-0 space-y-2">
                      <Skeleton height={17} width={160} />
                      <Skeleton height={13} width={200} />
                    </div>
                  </div>
                  <Skeleton height={20} width={82} />
                </div>
                <Skeleton height={5} borderRadius={99} />
                <div className="flex justify-between gap-3">
                  <Skeleton height={13} width={125} />
                  <Skeleton height={34} width={210} borderRadius={10} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </LoadingSkeletonTheme>
  )
}
