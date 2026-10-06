// src/components/landing/navbar.jsx

import { Link } from "react-router-dom"
import { Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ShinyButton } from "./shiny-btn"

export function Navbar() {
  return (
    <nav className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2 font-bold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
            <Wallet className="h-4 w-4" />
          </span>
          Finch
        </div>
        <div className="hidden gap-7 text-sm text-muted-foreground md:flex">
          <a href="#showcase" className="hover:text-foreground">The dashboard</a>
          <a href="#features" className="hover:text-foreground">What it does</a>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link to="/sign-in">Sign in</Link>
          </Button>
          <ShinyButton>
            <Link to="/sign-up">Get started</Link>
          </ShinyButton>
        </div>
      </div>
    </nav>
  )
}