import { LayoutDashboard, Landmark, Target, Receipt, ListChecks } from "lucide-react"
import { FeatureCard } from "@/components/landing/feature-card"
import { Progress } from "@/components/ui/progress"

export function FeaturesGrid() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-10 max-w-xl">
        <p className="mb-2 text-sm font-semibold text-primary">Everywhere else in the app</p>
        <h2 className="font-serif text-3xl font-semibold tracking-tight">Six parts that work together</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <FeatureCard icon={<LayoutDashboard className="h-5 w-5 text-primary" />} title="Dashboard" description="Your health score and what needs attention today.">
          <Progress value={78} className="h-1.5" />
        </FeatureCard>
        <FeatureCard icon={<Landmark className="h-5 w-5 text-destructive" />} title="Loans" description="See what's left and when it's due.">
          <Progress value={62} className="h-1.5" />
        </FeatureCard>
        <FeatureCard icon={<Target className="h-5 w-5 text-success" />} title="Goals" description="Save toward a target with a clear deadline.">
          <Progress value={64} className="h-1.5" />
        </FeatureCard>
        <FeatureCard icon={<Receipt className="h-5 w-5 text-warning" />} title="Expenses" description="Set a budget, log spending, see it by category.">
          <Progress value={64} className="h-1.5" />
        </FeatureCard>
        <FeatureCard icon={<ListChecks className="h-5 w-5 text-primary" />} title="Financial tasks" description="Bill reminders and to-dos, with receipts attached." />
      </div>
    </section>
  )
}