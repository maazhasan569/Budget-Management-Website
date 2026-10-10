import { useEffect, useState } from "react"
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  CircleDollarSign,
  Flag,
  Goal,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from "lucide-react"

import { getDashboardData } from "@/api/dashboard/dashboard"
import { CategoryPieChart } from "@/components/charts/category-pie-chart"
import { SpendingTrendChart } from "@/components/charts/spending-trend-chart"
import { EmptyDataState } from "@/components/dashboard/empty-data-state"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

function formatNumber(value) {
  return Number(value ?? 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })
}

function formatTrendLabel(label, granularity) {
  if (granularity === "day") {
    const date = new Date(`${label}T00:00:00`)
    return Number.isNaN(date.getTime())
      ? label
      : date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
  }
  if (granularity === "month") {
    const date = new Date(`${label}-01T00:00:00`)
    return Number.isNaN(date.getTime())
      ? label
      : date.toLocaleDateString(undefined, { month: "short", year: "2-digit" })
  }
  if (granularity === "year") return label
  return label.replace("-W", " · W")
}

function spendingChange(data) {
  if (data.length < 2) return null
  const previous = Number(data[data.length - 2].amount)
  const latest = Number(data[data.length - 1].amount)
  if (!Number.isFinite(previous) || !Number.isFinite(latest) || previous === 0) return null
  return Math.round(((latest - previous) / previous) * 100)
}

function periodName(granularity) {
  return ({ day: "day", week: "week", month: "month", year: "year" })[granularity] ?? "period"
}

function SectionError({ message, onRetry }) {
  return (
    <div className="flex min-h-[170px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-destructive/30 bg-destructive/5 p-6 text-center">
      <AlertTriangle className="size-5 text-destructive" aria-hidden="true" />
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}

function HealthScoreCard({ score, hasInputs, hasError }) {
  const roundedScore = Math.round(score)
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex h-full flex-col justify-between gap-6 p-6 sm:flex-row sm:items-center sm:p-7">
        <div className="max-w-sm">
          <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </div>
          <h2 className="font-display text-xl font-semibold">Financial health</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasError
              ? "Your score is temporarily unavailable. Try loading it again."
              : hasInputs
                ? "A snapshot based on your spending, goals, and loan progress."
                : "Your score starts at 100 while you add your first financial details."}
          </p>
        </div>
        {hasError ? (
          <div className="flex min-w-32 items-center justify-center text-4xl font-semibold text-muted-foreground">—</div>
        ) : (
          <div className="flex min-w-36 items-center gap-4">
            <div
              className="grid size-[88px] shrink-0 place-items-center rounded-full"
              style={{ background: `conic-gradient(var(--primary) ${roundedScore}%, var(--muted) ${roundedScore}% 100%)` }}
              role="img"
              aria-label={`Financial health score ${roundedScore} percent`}
            >
              <div className="grid size-[68px] place-items-center rounded-full bg-card text-xl font-semibold tabular-nums">
                {roundedScore}
              </div>
            </div>
            <span className="text-sm font-medium text-muted-foreground">out of 100</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function BudgetCard({ budget, hasError, onRetry }) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="size-4 text-primary" aria-hidden="true" /> Monthly budget
          </CardTitle>
          <CardDescription className="mt-1">Your planned spending for the month</CardDescription>
        </div>
        <Badge variant="secondary">Budget</Badge>
      </CardHeader>
      <CardContent>
        {hasError ? (
          <SectionError message="Couldn’t load your monthly budget. Please try again." onRetry={onRetry} />
        ) : budget == null ? (
          <EmptyDataState
            icon={CircleDollarSign}
            title="No budget details yet"
            description="Your monthly budget will appear here once it’s set up."
          />
        ) : (
          <div className="rounded-xl bg-muted/50 p-5">
            <p className="font-display text-3xl font-semibold tabular-nums">{formatNumber(budget)}</p>
            <p className="mt-1 text-sm text-muted-foreground">allocated for this month</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ProgressList({ items, type }) {
  const isGoal = type === "goal"
  const icon = isGoal ? Goal : BriefcaseBusiness
  const Icon = icon
  const actionTo = isGoal ? "/goals" : "/loans"
  const title = isGoal ? "No goals yet" : "No loans yet"
  const description = isGoal
    ? "Add a savings goal to see your progress here."
    : "Add a loan to keep its payoff progress in view."

  if (!items.length) {
    return (
      <EmptyDataState
        icon={Icon}
        title={title}
        description={description}
        actionLabel={isGoal ? "Add a goal" : "Add a loan"}
        actionTo={actionTo}
      />
    )
  }

  return (
    <div className="space-y-5">
      {items.slice(0, 4).map((item) => {
        const name = isGoal ? item.goalName : item.loanName
        const target = Number(isGoal ? item.targetAmount : item.loanTargetAmt)
        const current = Number(item.currentAmt)
        const rawProgress = Number(isGoal ? item.progressPercentage : item.progressPercent)
        const progress = Number.isFinite(rawProgress) ? Math.max(0, Math.min(rawProgress, 100)) : 0
        return (
          <div key={item._id} className="space-y-2.5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{name || (isGoal ? "Savings goal" : "Loan")}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatNumber(current)} of {formatNumber(target)}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} aria-label={`${name || (isGoal ? "Goal" : "Loan")} progress`} />
          </div>
        )
      })}
    </div>
  )
}

function AlertsCard({ alerts, flagged, alertsError, flaggedError, onRetry }) {
  const flaggedItems = [
    ...(flagged?.flaggedGoals ?? []).map((item) => ({ ...item, type: "goal" })),
    ...(flagged?.flaggedLoans ?? []).map((item) => ({ ...item, type: "loan" })),
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="size-4 text-primary" aria-hidden="true" /> Alerts &amp; follow-ups
        </CardTitle>
        <CardDescription>Upcoming contributions and items that may need attention</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 lg:grid-cols-2">
        <section aria-label="Upcoming due dates">
          <h3 className="mb-3 text-sm font-semibold">Coming up</h3>
          {alertsError ? (
            <SectionError message="Couldn’t load due-date alerts. Please try again." onRetry={onRetry} />
          ) : alerts.length === 0 ? (
            <EmptyDataState
              icon={CalendarClock}
              title="Nothing due soon"
              description="Upcoming manual goal and loan contributions will appear here."
              className="min-h-[160px]"
            />
          ) : (
            <div className="space-y-2">
              {alerts.map((alert, index) => {
                const item = alert.item ?? alert
                const days = Number(alert.daysUntilDue)
                const overdue = days < 0
                const itemName = alert.type === "goal" ? item.goalName : item.loanName
                return (
                  <div key={item._id ?? `${alert.type}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {overdue ? (
                        <AlertTriangle className="size-4 shrink-0 text-destructive" aria-hidden="true" />
                      ) : (
                        <CalendarClock className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{itemName || (alert.type === "goal" ? "Goal contribution" : "Loan payment")}</p>
                        <p className="text-xs capitalize text-muted-foreground">{alert.type}</p>
                      </div>
                    </div>
                    <Badge variant={overdue || days <= 3 ? "destructive" : "secondary"}>
                      {overdue ? `Overdue ${Math.abs(days)}d` : `Due in ${days}d`}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section aria-label="Flagged items">
          <h3 className="mb-3 text-sm font-semibold">Needs attention</h3>
          {flaggedError ? (
            <SectionError message="Couldn’t load flagged items. Please try again." onRetry={onRetry} />
          ) : flaggedItems.length === 0 ? (
            <EmptyDataState
              icon={ShieldCheck}
              title="All clear for now"
              description="Goals and loans needing attention will show up here."
              className="min-h-[160px]"
            />
          ) : (
            <div className="space-y-2">
              {flaggedItems.map((item) => {
                const isGoal = item.type === "goal"
                const itemName = isGoal ? item.goalName : item.loanName
                return (
                  <div key={item._id} className="flex items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning/5 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Flag className="size-4 shrink-0 text-warning" aria-hidden="true" />
                      <p className="truncate text-sm font-medium">{itemName || (isGoal ? "Savings goal" : "Loan")}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 border-warning/40 text-warning">{item.status}</Badge>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  )
}

function ChartEmptyCard({ title, description, icon: Icon, actionLabel, actionTo }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <EmptyDataState
          icon={Icon}
          title={description.title}
          description={description.body}
          actionLabel={actionLabel}
          actionTo={actionTo}
        />
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const [dashboard, setDashboard] = useState(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const retry = () => {
    setDashboard(null)
    setLoadFailed(false)
    setReloadKey((key) => key + 1)
  }

  useEffect(() => {
    let active = true
    getDashboardData().then((data) => {
      if (active) setDashboard(data)
    }).catch(() => {
      if (active) setLoadFailed(true)
    })
    return () => {
      active = false
    }
  }, [reloadKey])

  if (!dashboard) {
    if (loadFailed) {
      return (
        <div className="mx-auto max-w-7xl">
          <SectionError message="We couldn’t load your dashboard. Please try again." onRetry={retry} />
        </div>
      )
    }
    return <DashboardSkeleton />
  }

  const trendData = dashboard.spending.data.map(({ label, amount }) => ({
    date: formatTrendLabel(label, dashboard.spending.granularity),
    spent: Number(amount),
  }))
  const categoryData = Object.entries(dashboard.categoryPercentages).map(([category, amount]) => ({
    category,
    amount: Number(amount),
  }))
  const change = spendingChange(dashboard.spending.data)
  const categoryShare = categoryData.reduce((total, item) => total + item.amount, 0)

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Your financial overview</h1>
          <p className="mt-2 text-muted-foreground">A calm, clear look at your money and what’s next.</p>
        </div>
        <Button variant="outline" onClick={retry}>
          <RefreshCw className="mr-2 size-4" aria-hidden="true" /> Refresh
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <HealthScoreCard
          score={dashboard.score}
          hasInputs={dashboard.hasScoreInputs}
          hasError={dashboard.errors.score}
        />
        <BudgetCard budget={dashboard.budget} hasError={dashboard.errors.budget} onRetry={retry} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Goals</CardTitle>
            <CardDescription>Progress toward the things you’re saving for</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.errors.goals ? (
              <SectionError message="Couldn’t load goal progress. Please try again." onRetry={retry} />
            ) : (
              <ProgressList items={dashboard.goals} type="goal" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Loans</CardTitle>
            <CardDescription>Keep your repayment progress in view</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.errors.loans ? (
              <SectionError message="Couldn’t load loan progress. Please try again." onRetry={retry} />
            ) : (
              <ProgressList items={dashboard.loans} type="loan" />
            )}
          </CardContent>
        </Card>

        <div className="xl:col-span-2">
          <AlertsCard
            alerts={dashboard.alerts}
            flagged={dashboard.flagged}
            alertsError={dashboard.errors.alerts}
            flaggedError={dashboard.errors.flagged}
            onRetry={retry}
          />
        </div>

        <div className="xl:col-span-2">
          {dashboard.errors.trends ? (
            <Card>
              <CardHeader><CardTitle>Spending trend</CardTitle></CardHeader>
              <CardContent><SectionError message="Couldn’t load your spending trend. Please try again." onRetry={retry} /></CardContent>
            </Card>
          ) : trendData.length ? (
            <SpendingTrendChart
              data={trendData}
              trendPercent={change}
              periodLabel={periodName(dashboard.spending.granularity)}
            />
          ) : (
            <ChartEmptyCard
              title="Spending trend"
              description={{ title: "No spending to chart yet", body: "Your expense history will build a trend here." }}
              icon={ArrowUpRight}
              actionLabel="Add an expense"
              actionTo="/expenses"
            />
          )}
        </div>

        <div className="xl:col-span-2">
          {dashboard.errors.categories ? (
            <Card>
              <CardHeader><CardTitle>Spending by category</CardTitle></CardHeader>
              <CardContent><SectionError message="Couldn’t load spending categories. Please try again." onRetry={retry} /></CardContent>
            </Card>
          ) : categoryData.length ? (
            <CategoryPieChart
              data={categoryData}
              title="Spending by category"
              description="Share of your recorded expenses"
              centerValue={`${categoryShare.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`}
              centerCaption="of expenses"
            />
          ) : (
            <ChartEmptyCard
              title="Spending by category"
              description={{ title: "No categories to show", body: "Add expenses to see how they’re split by category." }}
              icon={ArrowDownRight}
              actionLabel="Add an expense"
              actionTo="/expenses"
            />
          )}
        </div>
      </div>
    </div>
  )
}
