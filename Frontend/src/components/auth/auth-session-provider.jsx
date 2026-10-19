import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"

import {
  subscribeToAuthState,
  verifyCurrentUser,
} from "@/api/auth/session"
import { AuthSessionContext } from "@/components/auth/auth-session-context"

function isAuthPage(pathname) {
  return ["/auth/login", "/auth/signup", "/sign-in", "/sign-up"].includes(pathname)
}

export function AuthSessionProvider({ children }) {
  const location = useLocation()
  const [initialPathname] = useState(location.pathname)
  const skipInitialCheck = isAuthPage(initialPathname)
  const [status, setStatus] = useState(skipInitialCheck ? "anonymous" : "checking")

  useEffect(() => {
    let active = true
    const unsubscribe = subscribeToAuthState((nextStatus) => {
      if (active) setStatus(nextStatus)
    })

    if (skipInitialCheck) {
      return () => {
        active = false
        unsubscribe()
      }
    }

    verifyCurrentUser()
      .then(() => {
        if (active) setStatus("authenticated")
      })
      .catch(() => {
        if (active) setStatus("anonymous")
      })

    return () => {
      active = false
      unsubscribe()
    }
  }, [initialPathname, skipInitialCheck])

  return (
    <AuthSessionContext.Provider value={status}>
      {children}
    </AuthSessionContext.Provider>
  )
}
