import { LoadingSkeletonTheme, Skeleton } from "@/components/ui/loading-skeleton-theme"

function SummaryCard({ score = false }) {
  return (
    <div className="flex min-h-36 items-center justify-between gap-5 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
      <div className="min-w-0 flex-1 space-y-3">
        <Skeleton height={20} width={score ? 155 : 140} />
        <Skeleton height={14} width="88%" />
        <Skeleton height={14} width="62%" />
      </div>
      {score ? (
        <Skeleton circle width={88} height={88} />
      ) : (
        <div className="w-1/2 rounded-xl bg-muted/40 p-4">
          <Skeleton height={30} width="70%" />
          <Skeleton className="mt-2" height={13} width="56%" />
        </div>
      )}
    </div>
  )
}

function ProgressCard() {
  return (
    <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <Skeleton height={20} width={125} />
      <Skeleton className="mt-2" height={14} width="76%" />
      <div className="mt-6 space-y-5">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <Skeleton height={14} width="48%" />
              <Skeleton height={14} width={34} />
            </div>
            <Skeleton height={8} borderRadius={999} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <LoadingSkeletonTheme>
      <div aria-label="Loading dashboard" aria-busy="true" className="mx-auto max-w-7xl space-y-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <Skeleton height={14} width={118} />
            <Skeleton height={38} width={300} />
            <Skeleton height={16} width={350} />
          </div>
          <Skeleton height={38} width={112} borderRadius={10} />
        </div>

        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <SummaryCard score />
          <SummaryCard />
        </div>

        <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
          <Skeleton height={21} width={165} />
          <Skeleton className="mt-5" height={190} borderRadius={12} />
          <Skeleton className="mt-4" height={14} width={208} />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <ProgressCard />
          <ProgressCard />

          <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6 xl:col-span-2">
            <Skeleton height={21} width={190} />
            <Skeleton className="mt-2" height={14} width={310} />
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {Array.from({ length: 2 }, (_, column) => (
                <div key={column} className="space-y-3">
                  <Skeleton height={15} width={100} />
                  {Array.from({ length: 2 }, (_, row) => (
                    <div key={row} className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
                      <Skeleton circle width={28} height={28} />
                      <div className="flex-1 space-y-2">
                        <Skeleton height={14} width="62%" />
                        <Skeleton height={12} width="38%" />
                      </div>
                      <Skeleton height={22} width={55} borderRadius={999} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6 xl:col-span-2">
            <Skeleton height={21} width={205} />
            <Skeleton className="mt-2" height={14} width={265} />
            <div className="mt-5 flex flex-col items-center gap-5">
              <Skeleton circle width={190} height={190} />
              <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="flex items-center gap-2 rounded-lg bg-muted/35 px-3 py-2">
                    <Skeleton circle width={10} height={10} />
                    <Skeleton height={14} width={`${48 + index * 7}%`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </LoadingSkeletonTheme>
  )
}
