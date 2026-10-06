import Link from "next/link"
import { Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ShinyButton } from "@/components/landing/shiny-button"

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
          <Link href="#showcase" className="hover:text-foreground">The dashboard</Link>
          <Link href="#features" className="hover:text-foreground">What it does</Link>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost">Sign in</Button>
          <ShinyButton>Get started</ShinyButton>
        </div>
      </div>
    </nav>
  )
}