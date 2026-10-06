"use client"
import { useRef } from "react"

export function FeatureCard({ icon, title, description, children }) {
  const ref = useRef(null)

  function onMouseMove(e) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty("--x", `${e.clientX - rect.left}px`)
    el.style.setProperty("--y", `${e.clientY - rect.top}px`)
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      className="group relative overflow-hidden rounded-2xl border bg-card p-6"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "radial-gradient(240px circle at var(--x,50%) var(--y,50%), hsl(var(--primary)/0.12), transparent 70%)" }}
      />
      <div className="relative z-10">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">{icon}</div>
        <h3 className="mb-1 font-semibold">{title}</h3>
        <p className="mb-3 text-sm text-muted-foreground">{description}</p>
        {children}
      </div>
    </div>
  )
}