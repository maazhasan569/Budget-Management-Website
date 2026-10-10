import { ArrowUpRight, CircleDot } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"

export function SectionPlaceholder({ title, description, comingSoon = false }) {
  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-5xl flex-col justify-center">
      <div className="max-w-xl rounded-2xl border border-border bg-card p-8 shadow-sm sm:p-10">
        <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <CircleDot className="size-6" aria-hidden="true" />
        </div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-primary">
          {comingSoon ? "Coming soon" : "Your workspace"}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-md text-muted-foreground">{description}</p>
        {comingSoon && (
          <Button asChild variant="outline" className="mt-7">
            <Link to="/dashboard">
              Back to dashboard <ArrowUpRight className="ml-2 size-4" />
            </Link>
          </Button>
        )}
      </div>
    </section>
  )
}
