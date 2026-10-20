import { Navigate, Outlet, useLocation } from "react-router-dom"
import { AlertCircle, RotateCw } from "lucide-react"

import { useAuthSession } from "@/components/auth/auth-session-context"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

export function AuthRouteGuard({ guestOnly = false, anonymousTo }) {
  const location = useLocation()
  const status = useAuthSession()

  if (status === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="size-6 text-primary" />
      </main>
    )
  }

  if (status === "unavailable") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-4">
        <section role="alert" className="max-w-md space-y-4 rounded-xl border border-border bg-card p-6 text-center">
          <AlertCircle className="mx-auto size-6 text-destructive" aria-hidden="true" />
          <div>
            <h1 className="font-semibold">Can’t reach the server</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Finch couldn’t verify your session. Check that the backend is running, then try again.
            </p>
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RotateCw className="mr-2 size-4" aria-hidden="true" />Retry
          </Button>
        </section>
      </main>
    )
  }

  if (guestOnly && status === "authenticated") {
    return <Navigate to="/dashboard" replace />
  }

  if (status === "anonymous" && anonymousTo) {
    return <Navigate to={anonymousTo} replace />
  }

  if (!guestOnly && status === "anonymous") {
    return <Navigate to="/auth/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
