import { Wallet } from "lucide-react"

export function BrandLoader() {
  return (
    <div role="status" aria-label="Finch is loading" className="flex items-center justify-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm animate-[finch-logo-pulse_1.8s_ease-in-out_infinite] motion-reduce:animate-none">
        <Wallet className="size-6" aria-hidden="true" />
      </span>
    </div>
  )
}
