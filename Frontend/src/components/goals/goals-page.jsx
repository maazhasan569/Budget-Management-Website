import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertCircle,
  ArrowDownWideNarrow,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Flag,
  HandCoins,
  Pencil,
  PiggyBank,
  Plus,
  RotateCw,
  Tags,
  Target,
  Trash2,
  WalletCards,
} from "lucide-react"

import {
  createGoal,
  deleteGoal,
  getCachedGoalPage,
  getGoalsPage,
  makeGoalContribution,
  syncGoalAutoDeduction,
  updateGoal,
} from "@/api/goals/goals"
import { EmptyDataState } from "@/components/dashboard/empty-data-state"
import {
  DeleteGoalDialog,
  GoalContributionDialog,
  GoalFormDialog,
} from "@/components/goals/goal-dialogs"
import { GoalsSkeleton } from "@/components/goals/goals-skeleton"
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { formatCurrency, getSelectedCurrency } from "@/lib/currency"

const PAGE_SIZE = 8
const ALL_CATEGORIES = "__all_categories__"
const DEFAULT_SORT = "createdAt:desc"
const SORT_LABELS = {
  "createdAt:desc": "Newest first",
  "createdAt:asc": "Oldest first",
  "goalName:asc": "Name A–Z",
  "goalName:desc": "Name Z–A",
  "targetAmount:desc": "Target: high to low",
  "targetAmount:asc": "Target: low to high",
}

function formatDate(value) {
  if (!value) return "No achievement date"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "No achievement date"
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

function goalStatus(goal) {
  if (Number(goal.currentAmt) >= Number(goal.targetAmount) && Number(goal.targetAmount) > 0) {
    return { label: "Achieved", variant: "secondary" }
  }

  const labels = {
    in_progress: ["In progress", "outline"],
    Paused: ["Paused", "secondary"],
    no_funds: ["Needs funds", "destructive"],
    Abondened: ["Archived", "secondary"],
    Achieved: ["Achieved", "secondary"],
    unAchieved: ["Past due", "destructive"],
  }
  const [label, variant] = labels[goal.status] ?? labels.in_progress
  return { label, variant }
}

function categoryColor(category) {
  const hash = [...String(category || "General").toLowerCase()]
    .reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return `var(--chart-${(hash % 5) + 1})`
}

function termLabel(goal) {
  const storedDuration = Number(goal.duration) || 0
  const duration = goal.type === "Yearly" ? storedDuration / 12 : storedDuration
  const unit = goal.type === "Yearly" ? "year" : "month"
  return `${duration} ${duration === 1 ? unit : `${unit}s`}`
}

function hasPaidThisMonth(goal) {
  const lastDate = goal.deductionDates?.at(-1)
  return lastDate ? new Date(lastDate).getMonth() === new Date().getMonth() : false
}

function isPastAchievementDate(goal) {
  if (!goal.achievementDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const achievementDate = new Date(goal.achievementDate)
  achievementDate.setHours(0, 0, 0, 0)
  return today >= achievementDate && Number(goal.currentAmt) < Number(goal.targetAmount)
}

function SummaryCard({ title, amount, description, icon: Icon, tone = "primary", currency }) {
  const toneClass = tone === "success" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="flex items-start justify-between gap-4 p-5 sm:p-6">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 break-words font-display text-2xl font-semibold tabular-nums sm:text-3xl">
            {formatCurrency(amount, currency)}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">{description}</p>
        </div>
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${toneClass}`}>
          <Icon className="size-5" aria-hidden="true" />
        </div>
      </CardContent>
      <div className={`absolute inset-x-0 bottom-0 h-1 ${tone === "success" ? "bg-success/60" : "bg-primary/60"}`} />
    </Card>
  )
}

function GoalsError({ onRetry }) {
  return (
    <Card className="border-destructive/20">
      <CardContent className="flex flex-col items-start gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
          <div>
            <p className="font-medium">We couldn’t load your goals</p>
            <p className="mt-1 text-sm text-muted-foreground">Please check your connection and try again.</p>
          </div>
        </div>
        <Button variant="outline" onClick={onRetry}><RotateCw className="mr-2 size-4" aria-hidden="true" />Try again</Button>
      </CardContent>
    </Card>
  )
}

function GoalCard({ goal, currency, onEdit, onContribute, onDelete }) {
  const target = Math.max(0, Number(goal.targetAmount) || 0)
  const saved = Math.max(0, Number(goal.currentAmt) || 0)
  const remaining = Math.max(0, target - saved)
  const progress = target > 0 ? Math.min(100, (saved / target) * 100) : 0
  const category = goal.category || "General"
  const color = categoryColor(category)
  const status = goalStatus(goal)
  const monthlyPaid = hasPaidThisMonth(goal)
  const pastDate = isPastAchievementDate(goal)
  const canContribute = !goal.autoDeduction && goal.status === "in_progress" && remaining > 0 && !monthlyPaid && !pastDate
  const disabledReason = goal.autoDeduction
    ? "Automatic contributions are enabled for this goal."
    : goal.status !== "in_progress"
      ? "Only in-progress goals can receive manual contributions."
      : remaining <= 0
        ? "This goal is achieved."
        : monthlyPaid
          ? "A contribution has already been recorded this month."
          : pastDate
            ? "The achievement date has passed. Edit the goal timeline to continue."
            : ""

  return (
    <article className="rounded-xl border border-border/80 bg-card p-4 transition-colors hover:bg-muted/15 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border" style={{ color, borderColor: `color-mix(in srgb, ${color} 35%, transparent)`, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}>
            <Target className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="break-words text-base font-semibold leading-tight sm:text-lg">{goal.goalName || "Untitled goal"}</h3>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1" style={{ color }}><Tags className="size-3.5" aria-hidden="true" />{category}</span>
              <span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" aria-hidden="true" />{termLabel(goal)}</span>
              <span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" aria-hidden="true" />By {formatDate(goal.achievementDate)}</span>
              <span className="inline-flex items-center gap-1">{goal.autoDeduction ? <><CheckCircle2 className="size-3.5 text-primary" aria-hidden="true" />Automatic</> : <><HandCoins className="size-3.5" aria-hidden="true" />Manual</>}</span>
            </div>
          </div>
        </div>
        <p className="ml-auto whitespace-nowrap font-display text-xl font-semibold tabular-nums sm:text-2xl">
          {formatCurrency(target, currency)}<span className="ml-1 text-xs font-normal text-muted-foreground">target</span>
        </p>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-muted-foreground">Savings progress</span>
          <span className="font-medium tabular-nums">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} aria-label={`${Math.round(progress)} percent saved`} className="gap-0 [&_[data-slot=progress-track]]:h-2" />
        <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>Saved <strong className="font-semibold tabular-nums text-foreground">{formatCurrency(saved, currency)}</strong></span>
          <span>Remaining <strong className="font-semibold tabular-nums text-foreground">{formatCurrency(remaining, currency)}</strong></span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
        <span className="text-xs text-muted-foreground">
          {goal.autoDeduction ? "Automatic contribution" : `${Number(goal.totalDeductions) || 0} manual ${Number(goal.totalDeductions) === 1 ? "contribution" : "contributions"}`}
        </span>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {canContribute && (
            <Button size="sm" variant="secondary" onClick={() => onContribute(goal)}>
              <HandCoins className="mr-1.5 size-4" aria-hidden="true" />Contribute
            </Button>
          )}
          <Button variant="ghost" size="icon-lg" className="size-10 text-muted-foreground hover:bg-primary/10 hover:text-primary" aria-label={`Edit ${goal.goalName}`} title={`Edit ${goal.goalName}`} onClick={() => onEdit(goal)}>
            <Pencil className="size-4" aria-hidden="true" />
          </Button>
          <span aria-hidden="true" className="h-6 border-l border-border" />
          <Button variant="ghost" size="icon-lg" className="size-10 text-destructive/80 hover:bg-destructive/10 hover:text-destructive" aria-label={`Delete ${goal.goalName}`} title={`Delete ${goal.goalName}`} onClick={() => onDelete(goal)}>
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
      {!canContribute && disabledReason && !goal.autoDeduction && goal.status === "in_progress" && remaining > 0 && (
        <p className="mt-2 text-right text-xs text-muted-foreground">{disabledReason}</p>
      )}
    </article>
  )
}

export function GoalsPage() {
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState("")
  const [sort, setSort] = useState(DEFAULT_SORT)
  const [reloadKey, setReloadKey] = useState(0)
  const [editingGoal, setEditingGoal] = useState(null)
  const [contributingGoal, setContributingGoal] = useState(null)
  const [deletingGoal, setDeletingGoal] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [listError, setListError] = useState(false)
  const [schedulerNotice, setSchedulerNotice] = useState("")
  const hasLoadedRef = useRef(false)
  const currency = getSelectedCurrency()
  const [sortBy, sortType] = sort.split(":")
  const query = useMemo(() => ({
    page,
    limit: PAGE_SIZE,
    sortBy,
    sortType,
    ...(category ? { category } : {}),
  }), [page, sortBy, sortType, category])
  const cachedData = getCachedGoalPage(query)
  const visibleData = cachedData ?? data
  const goals = visibleData?.goals ?? []
  const categories = [...new Set((data?.goals ?? []).map((goal) => goal.category).filter(Boolean))].sort()

  useEffect(() => {
    let active = true
    const cached = getCachedGoalPage(query)
    if (cached) {
      setData(cached)
      hasLoadedRef.current = true
    }
    setLoading(!hasLoadedRef.current && !cached)
    setRefreshing(hasLoadedRef.current && !cached)
    setLoadError(false)
    setListError(false)

    getGoalsPage(query, { forceRefresh: reloadKey > 0 })
      .then((result) => {
        if (!active) return
        setData(result)
        hasLoadedRef.current = true
        if (page > result.totalPages && result.totalPages > 0) setPage(result.totalPages)
        setLoadError(false)
      })
      .catch(() => {
        if (!active) return
        if (hasLoadedRef.current) setListError(true)
        else setLoadError(true)
      })
      .finally(() => {
        if (!active) return
        setLoading(false)
        setRefreshing(false)
      })

    return () => { active = false }
  }, [query, reloadKey, page])

  function refresh() {
    setReloadKey((current) => current + 1)
  }

  async function syncSchedulerAfterMutation() {
    try {
      await syncGoalAutoDeduction()
      setSchedulerNotice("")
    } catch {
      setSchedulerNotice("Your goal was saved, but automatic contributions couldn’t be synchronized. Please try saving again.")
    }
  }

  async function saveGoal(values) {
    if (editingGoal) await updateGoal(editingGoal._id, values)
    else {
      await createGoal(values)
      setPage(1)
    }
    setEditingGoal(null)
    await syncSchedulerAfterMutation()
    refresh()
  }

  async function recordContribution(amount) {
    await makeGoalContribution(contributingGoal._id, amount)
    await syncSchedulerAfterMutation()
    setContributingGoal(null)
    refresh()
  }

  async function removeGoal() {
    await deleteGoal(deletingGoal._id)
    await syncSchedulerAfterMutation()
    if (goals.length === 1 && page > 1) setPage((current) => current - 1)
    else refresh()
    setDeletingGoal(null)
  }

  if (loading) return <GoalsSkeleton />

  return (
    <div className="mx-auto max-w-7xl space-y-6 sm:space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Small steps toward what matters</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Goals</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Turn the things you’re saving for into a steady, visible plan.</p>
        </div>
        {goals.length > 0 && (
          <Button onClick={() => { setEditingGoal(null); setFormOpen(true) }}>
            <Plus className="mr-2 size-4" aria-hidden="true" />Add goal
          </Button>
        )}
      </header>

      {loadError ? (
        <GoalsError onRetry={refresh} />
      ) : (
        <>
          {schedulerNotice && <p role="status" className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-muted-foreground">{schedulerNotice}</p>}
          <section className="grid gap-3 sm:grid-cols-2" aria-label="Goal savings summary">
            <SummaryCard title="Total saved" amount={visibleData?.amountPaid ?? 0} description="Across active goals and recorded history" icon={CircleDollarSign} tone="success" currency={currency} />
            <SummaryCard title="Remaining to save" amount={visibleData?.amountRemaining ?? 0} description="Outstanding across active goals" icon={PiggyBank} currency={currency} />
          </section>

          {goals.length === 0 && !category ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Flag className="size-4 text-primary" aria-hidden="true" />Your goal plan</CardTitle>
                <CardDescription>Every goal you create will have a clear target and progress plan.</CardDescription>
              </CardHeader>
              <CardContent>
                <EmptyDataState
                  icon={Target}
                  title="No goals yet"
                  description="Add your first goal to give your savings a purpose and track your progress."
                  actionLabel="Create your first goal"
                  actionOnClick={() => { setEditingGoal(null); setFormOpen(true) }}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><WalletCards className="size-4 text-primary" aria-hidden="true" />Your goals</CardTitle>
                  <CardDescription className="mt-1">
                    {visibleData?.totalDoc ?? 0} {(visibleData?.totalDoc ?? 0) === 1 ? "goal" : "goals"}{category ? ` in ${category}` : " in your plan"}
                  </CardDescription>
                </div>
                <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
                  <Select value={category || ALL_CATEGORIES} onValueChange={(value) => { setCategory(value === ALL_CATEGORIES ? "" : value); setPage(1) }}>
                    <SelectTrigger className="h-9 min-w-0 w-full sm:w-[190px]" aria-label="Filter goals by category">
                      <SelectValue>{category || "All categories"}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Categories</SelectLabel>
                        <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
                        {categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Select value={sort} onValueChange={(value) => { setSort(value); setPage(1) }}>
                    <SelectTrigger className="h-9 min-w-0 w-full sm:w-[190px]" aria-label="Sort goals">
                      <ArrowDownWideNarrow className="mr-1.5 size-4 text-muted-foreground" aria-hidden="true" />
                      <SelectValue>{SORT_LABELS[sort]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Sort by</SelectLabel>
                        {Object.entries(SORT_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-4" aria-busy={refreshing}>
                {refreshing && <p role="status" className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">Updating your goals…</p>}
                {listError && (
                  <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Couldn’t refresh this list. Your last loaded goals are still shown.</span>
                    <Button size="sm" variant="outline" onClick={refresh}>Try again</Button>
                  </div>
                )}
                <div className={refreshing ? "space-y-3 opacity-60 transition-opacity" : "space-y-3 transition-opacity"}>
                  {goals.length === 0 ? (
                    <EmptyDataState icon={Tags} title={`No ${category} goals`} description="Choose another category or clear the filter to see all goals." className="min-h-[170px]" />
                  ) : goals.map((goal) => (
                    <GoalCard
                      key={goal._id}
                      goal={goal}
                      currency={currency}
                      onEdit={(selected) => { setEditingGoal(selected); setFormOpen(true) }}
                      onContribute={setContributingGoal}
                      onDelete={setDeletingGoal}
                    />
                  ))}
                </div>

                {(visibleData?.totalPages ?? 0) > 1 && (
                  <div className="flex flex-col items-center gap-3 border-t border-border/70 pt-4 sm:flex-row sm:justify-between">
                    <p className="text-xs text-muted-foreground">Page {page} of {visibleData.totalPages}</p>
                    <Pagination className="mx-0 w-auto">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious href="#goals" aria-disabled={page <= 1} tabIndex={page <= 1 ? -1 : undefined} className={page <= 1 ? "pointer-events-none opacity-50" : ""} onClick={(event) => { event.preventDefault(); if (page > 1) setPage(page - 1) }} />
                        </PaginationItem>
                        {Array.from({ length: visibleData.totalPages }, (_, index) => index + 1).slice(Math.max(0, page - 2), Math.max(0, page - 2) + 5).map((pageNumber) => (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink href="#goals" isActive={pageNumber === page} aria-label={`Go to page ${pageNumber}`} onClick={(event) => { event.preventDefault(); setPage(pageNumber) }}>{pageNumber}</PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext href="#goals" aria-disabled={page >= visibleData.totalPages} tabIndex={page >= visibleData.totalPages ? -1 : undefined} className={page >= visibleData.totalPages ? "pointer-events-none opacity-50" : ""} onClick={(event) => { event.preventDefault(); if (page < visibleData.totalPages) setPage(page + 1) }} />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {formOpen && (
        <GoalFormDialog
          key={editingGoal?._id ?? "new-goal"}
          open
          onOpenChange={setFormOpen}
          goal={editingGoal}
          currency={currency}
          onSave={saveGoal}
        />
      )}
      {contributingGoal && (
        <GoalContributionDialog
          key={contributingGoal._id}
          open
          onOpenChange={(open) => { if (!open) setContributingGoal(null) }}
          goal={contributingGoal}
          currency={currency}
          onContribute={recordContribution}
        />
      )}
      {deletingGoal && (
        <DeleteGoalDialog
          key={deletingGoal._id}
          open
          onOpenChange={(open) => { if (!open) setDeletingGoal(null) }}
          goal={deletingGoal}
          currency={currency}
          onDelete={removeGoal}
        />
      )}
    </div>
  )
}
