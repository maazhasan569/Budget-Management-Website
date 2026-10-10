import { Skeleton } from "@/components/ui/skeleton"

function SkeletonCard({ className = "", rows = 3 }) {
  return (
    <div className={`rounded-xl bg-card p-5 ring-1 ring-foreground/10 ${className}`}>
      <Skeleton className="h-5 w-36" />
      <div className="mt-5 space-y-4">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-3">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-2.5 w-full" />
            </div>
            <Skeleton className="h-4 w-10" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div aria-label="Loading dashboard" className="mx-auto max-w-7xl space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-9 w-52" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <SkeletonCard rows={2} />
        <SkeletonCard rows={2} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SkeletonCard rows={3} />
        <SkeletonCard rows={3} />
        <SkeletonCard className="xl:col-span-2" rows={4} />
        <SkeletonCard className="xl:col-span-2" rows={3} />
        <SkeletonCard rows={2} />
        <SkeletonCard rows={2} />
      </div>
    </div>
  )
}
