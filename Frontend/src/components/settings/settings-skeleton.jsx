import { LoadingSkeletonTheme, Skeleton } from "@/components/ui/loading-skeleton-theme"

export function SettingsSkeleton() {
  return (
    <LoadingSkeletonTheme>
      <div
        className="mx-auto w-full max-w-5xl px-1"
        aria-label="Loading settings"
        aria-busy="true"
      >
        <div>
          {[0, 1, 2, 3, 4].map((row) => (
            <div
              key={row}
              className="grid gap-3 border-b border-border/70 py-5 sm:grid-cols-[minmax(0,1fr)_minmax(220px,320px)] sm:items-center"
            >
              <div className="space-y-2">
                <Skeleton height={16} width={row === 0 ? 105 : 145} />
                <Skeleton height={14} width={row === 0 ? 255 : 290} />
              </div>
              <Skeleton
                className="w-full sm:ml-auto sm:max-w-xs"
                height={40}
                width="100%"
                borderRadius={8}
              />
            </div>
          ))}
          <div className="flex justify-end border-t border-border/70 pt-5">
            <Skeleton height={40} width={136} borderRadius={8} />
          </div>
        </div>
      </div>
    </LoadingSkeletonTheme>
  )
}
