import { useState } from "react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
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
  function renderNavigationLink({ label, to, icon: Icon }) {
    return (
      <NavLink
        key={to}
        to={to}
        onClick={onNavigate}
        className={({ isActive }) =>
          `group relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-[background-color,color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring ${
            isActive
              ? "active bg-sidebar-accent text-sidebar-accent-foreground shadow-sm shadow-primary/5 before:absolute before:inset-y-2.5 before:left-0 before:w-[3px] before:rounded-full before:bg-sidebar-primary"
              : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
          }`
        }
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors group-hover:bg-background/70 group-[.active]:bg-background">
          <Icon className="size-[18px] shrink-0" aria-hidden="true" />
        </span>
        <span className="flex-1">{label}</span>
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full bg-sidebar-primary opacity-0 transition-opacity group-[.active]:opacity-100"
        />
      </NavLink>
    )
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="pointer-events-none absolute -left-20 -top-20 size-56 rounded-full bg-sidebar-primary/5 blur-3xl" aria-hidden="true" />
      <div className="relative flex h-[84px] shrink-0 items-center gap-3 border-b border-sidebar-border/80 px-5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-sidebar-primary/20 ring-1 ring-sidebar-primary/15">
          <Wallet className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="font-display text-xl font-semibold leading-none">Finch</p>
          <p className="mt-1.5 text-[11px] font-medium tracking-wide text-muted-foreground">MONEY, IN FOCUS</p>
        </div>
      </div>

      <nav aria-label="Main navigation" className="relative flex-1 space-y-1 overflow-y-auto px-3 py-6">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
          Workspace
        </p>
        {navigation.map(renderNavigationLink)}

        <div className="mx-3 mb-4 mt-7 border-t border-sidebar-border/70" />
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
          Personal
        </p>
        {secondaryNavigation.map(renderNavigationLink)}
      </nav>

      <div className="relative shrink-0 border-t border-sidebar-border/80 p-3">
        <div className="mb-3 overflow-hidden rounded-xl border border-sidebar-border/80 bg-gradient-to-br from-sidebar-accent/80 to-sidebar-accent/30 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary/10 text-sidebar-primary">
              <CircleHelp className="size-4" aria-hidden="true" />
            </div>
            <span className="rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
              Your pace
            </span>
          </div>
          <p className="text-sm font-semibold">Your money, your pace</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">A clearer view starts here.</p>
        </div>
        <Button
          variant="ghost"
          className="h-10 w-full justify-start gap-3 rounded-xl px-3 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          onClick={onLogout}
          disabled={isLoggingOut}
        >
          <LogOut className="size-[18px]" aria-hidden="true" />
          {isLoggingOut ? "Signing out…" : "Log out"}
        </Button>
      </div>
    </div>
  )
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const navigate = useNavigate()

  async function handleLogout() {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    let logoutFailed = false

    try {
      await logOut()
    } catch {
      logoutFailed = true
    } finally {
      navigate("/", {
        replace: true,
        state: logoutFailed ? { logoutError: "We couldn’t reach the server to finish signing you out." } : null,
      })
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background text-foreground lg:flex">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-sidebar-border/80 bg-sidebar text-sidebar-foreground shadow-[8px_0_32px_-28px_var(--foreground)] lg:flex">
        <SidebarContent onLogout={handleLogout} isLoggingOut={isLoggingOut} />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            <motion.button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-foreground/30"
              onClick={() => setMobileOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
            />
            <motion.aside
              className="relative flex h-full w-[min(84vw,300px)] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl will-change-transform"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
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
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

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

        <main className="site-page-enter mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-7 sm:py-9 lg:px-10 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
