import { useState } from "react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"
import {
  Activity,
  ArrowLeftRight,
  Banknote,
  CheckSquare,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Target,
  Wallet,
  X,
} from "lucide-react"

import { logOut } from "@/api/auth/logout"
import { Button } from "@/components/ui/button"

const navigation = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Expenses", to: "/expenses", icon: ArrowLeftRight },
  { label: "Loans", to: "/loans", icon: Banknote },
  { label: "Goals", to: "/goals", icon: Target },
  { label: "Financial Tasks", to: "/financial-tasks", icon: CheckSquare },
]

const secondaryNavigation = [
  { label: "Settings", to: "/settings", icon: Settings },
  { label: "History", to: "/history", icon: Activity },
]

function SidebarContent({ onNavigate, onLogout, isLoggingOut }) {
  return (
    <>
      <div className="flex h-[76px] items-center gap-3 border-b border-sidebar-border px-5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
          <Wallet className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="font-display text-xl font-semibold leading-none">Finch</p>
          <p className="mt-1 text-xs text-muted-foreground">Money, in focus</p>
        </div>
      </div>

      <nav aria-label="Main navigation" className="flex-1 space-y-1 px-3 py-6">
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Workspace
        </p>
        {navigation.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
              }`
            }
          >
            <Icon className="size-[18px] shrink-0" aria-hidden="true" />
            {label}
          </NavLink>
        ))}

        <p className="mb-3 mt-8 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Personal
        </p>
        {secondaryNavigation.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
              }`
            }
          >
            <Icon className="size-[18px] shrink-0" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-sidebar-accent/60 p-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CircleHelp className="size-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">Your money, your pace</p>
            <p className="text-xs text-muted-foreground">A clearer view starts here.</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="h-10 w-full justify-start gap-3 px-3 text-muted-foreground hover:text-foreground"
          onClick={onLogout}
          disabled={isLoggingOut}
        >
          <LogOut className="size-[18px]" aria-hidden="true" />
          {isLoggingOut ? "Signing out…" : "Log out"}
        </Button>
      </div>
    </>
  )
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState("")
  const navigate = useNavigate()

  async function handleLogout() {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    setLogoutError("")

    try {
      await logOut()
      navigate("/sign-in", { replace: true })
    } catch {
      setLogoutError("We couldn’t sign you out. Please try again.")
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background text-foreground lg:flex">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <SidebarContent onLogout={handleLogout} isLoggingOut={isLoggingOut} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-[min(84vw,300px)] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl">
            <div className="absolute right-3 top-5">
              <Button variant="ghost" size="icon" aria-label="Close menu" onClick={() => setMobileOpen(false)}>
                <X className="size-5" />
              </Button>
            </div>
            <SidebarContent
              onNavigate={() => setMobileOpen(false)}
              onLogout={handleLogout}
              isLoggingOut={isLoggingOut}
            />
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1 lg:pl-[264px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-border/80 bg-background/90 px-4 backdrop-blur-md sm:px-7 lg:hidden">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
              <Menu className="size-5" />
            </Button>
            <span className="font-display text-xl font-semibold">Finch</span>
          </div>
          <Button variant="ghost" size="icon" aria-label="Log out" onClick={handleLogout} disabled={isLoggingOut}>
            <LogOut className="size-5" />
          </Button>
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-7 sm:py-9 lg:px-10 lg:py-10">
          {logoutError && (
            <div role="alert" className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <span>{logoutError}</span>
              <Button variant="ghost" size="sm" className="shrink-0" onClick={() => setLogoutError("")}>
                Dismiss <X className="ml-1 size-4" />
              </Button>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  )
}
