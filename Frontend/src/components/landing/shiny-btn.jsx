"use client"
import { cn } from "@/lib/utils"

export function ShinyButton({ children, className }) {
  return (
    <button
      className={cn(
        "relative z-0 overflow-hidden rounded-md bg-foreground px-5 py-2 text-sm font-semibold text-background",
        "before:absolute before:-inset-[2px] before:-z-10 before:rounded-[8px] before:bg-[conic-gradient(from_var(--angle),hsl(var(--primary)),hsl(var(--chart-2)),hsl(var(--success)),hsl(var(--primary)))] before:[animation:spin_4s_linear_infinite]",
        "after:absolute after:inset-[1.5px] after:-z-10 after:rounded-[7px] after:bg-foreground",
        className
      )}
      style={{ "--angle": "0deg" }}
    >
      {children}
    </button>
  )
}