import { Skeleton } from "@/components/ui/skeleton"

export function ExpensesSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-7" aria-label="Loading expenses" aria-busy="true">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-64 max-w-[80vw]" />
          <Skeleton className="h-4 w-80 max-w-[90vw]" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </header>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex flex-wrap gap-3">
          <Skeleton className="h-10 w-full max-w-56 rounded-lg" />
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="flex items-center gap-4 rounded-xl border border-border/70 p-4">
              <Skeleton className="size-10 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40 max-w-full" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-5 w-20" />
              <Skeleton className="hidden h-8 w-20 sm:block" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

