import { useEffect, useState } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"

import { verifyCurrentUser } from "@/api/auth/session"
import { Spinner } from "@/components/ui/spinner"

export function AuthRouteGuard({ guestOnly = false }) {
  const location = useLocation()
  const [status, setStatus] = useState("checking")

  useEffect(() => {
    let active = true

    verifyCurrentUser()
      .then(() => {
        if (!active) return
        setStatus("authenticated")
      })
      .catch(() => {
        if (!active) return
        setStatus("anonymous")
      })

    return () => {
      active = false
    }
  }, [])

  if (status === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="size-6 text-primary" />
      </main>
    )
  }

  if (guestOnly && status === "authenticated") {
    return <Navigate to="/dashboard" replace />
  }

  if (!guestOnly && status === "anonymous") {
    return <Navigate to="/sign-in" replace state={{ from: location }} />
  }

  return <Outlet />
}
