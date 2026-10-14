import { LoadingSkeletonTheme, Skeleton } from "@/components/ui/loading-skeleton-theme"

export function LoansSkeleton() {
  return (
    <LoadingSkeletonTheme>
      <div className="mx-auto max-w-7xl space-y-7" aria-label="Loading loans" aria-busy="true">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton height={14} width={126} />
            <Skeleton height={38} width={190} />
            <Skeleton height={16} width={340} />
          </div>
          <Skeleton height={40} width={136} borderRadius={10} />
        </header>

        <section className="grid gap-3 sm:grid-cols-2">
          {[0, 1].map((item) => (
            <div key={item} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <Skeleton height={14} width={110} />
                  <Skeleton height={31} width={170} />
                </div>
                <Skeleton circle width={40} height={40} />
              </div>
              <Skeleton className="mt-4" height={12} width={135} />
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <Skeleton height={19} width={140} />
              <Skeleton height={13} width={210} />
            </div>
            <Skeleton height={34} width={170} borderRadius={10} />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="space-y-3 rounded-xl border border-border/70 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <Skeleton circle width={42} height={42} />
                    <div className="min-w-0 space-y-2">
                      <Skeleton height={17} width={155} />
                      <Skeleton height={13} width={210} />
                    </div>
                  </div>
                  <Skeleton height={20} width={80} />
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
