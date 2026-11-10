import { Navigate, Outlet } from "react-router-dom"
import { AlertCircle, RotateCw, Wallet } from "lucide-react"

import { useAuthSession } from "@/components/auth/auth-session-context"
import { Button } from "@/components/ui/button"
import { BrandLoader } from "@/components/ui/brand-loader"

export function AuthRouteGuard({ guestOnly = false }) {
  const status = useAuthSession()

  if (status === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <BrandLoader />
      </main>
    )
  }

  if (status === "unavailable") {
    return (
      <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div className="absolute -left-32 -top-32 size-96 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute -bottom-40 -right-24 size-[28rem] rounded-full bg-chart-2/8 blur-3xl" />
        </div>
        <section
          role="alert"
          className="w-full max-w-lg rounded-2xl border border-border/80 bg-card/95 p-7 shadow-2xl shadow-foreground/5 backdrop-blur sm:p-10"
        >
          <div className="mb-9 flex items-center justify-center gap-2.5 sm:justify-start">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Wallet className="size-[18px]" aria-hidden="true" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">Finch</span>
          </div>

          <div className="mx-auto max-w-sm text-center sm:mx-0 sm:text-left">
            <div className="relative mx-auto mb-6 flex size-[76px] items-center justify-center sm:mx-0">
              <span className="absolute inset-0 rounded-3xl bg-destructive/10" aria-hidden="true" />
              <span className="absolute inset-2 rounded-2xl border border-destructive/15" aria-hidden="true" />
              <AlertCircle className="relative size-8 text-destructive" strokeWidth={1.7} aria-hidden="true" />
            </div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-warning/25 bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
              <span className="size-1.5 rounded-full bg-warning" aria-hidden="true" />
              Temporary connection issue
            </p>
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              We can’t connect right now
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Finch is having trouble connecting to your account. This is usually temporary—please try again in a moment.
            </p>
            <Button className="mt-7 w-full sm:w-auto" onClick={() => window.location.reload()}>
              <RotateCw className="mr-2 size-4" aria-hidden="true" />
              Try again
            </Button>
            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
              If the problem continues, wait a little and try again.
            </p>
          </div>
        </section>
      </main>
    )
  }

  if (guestOnly && status === "authenticated") {
    return <Navigate to="/dashboard" replace />
  }

  if (!guestOnly && status === "anonymous") {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
