import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertCircle,
  ArrowDownWideNarrow,
  Banknote,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  HandCoins,
  Landmark,
  Pencil,
  Plus,
  RotateCw,
  Tags,
  Trash2,
  WalletCards,
} from "lucide-react"

import {
  createLoan,
  deleteLoan,
  getCachedLoanPage,
  getLoansPage,
  makeLoanPayment,
  updateLoan,
} from "@/api/loans/loans"
import { EmptyDataState } from "@/components/dashboard/empty-data-state"
import {
  DeleteLoanDialog,
  LoanFormDialog,
  LoanPaymentDialog,
} from "@/components/loans/loan-dialogs"
import { LoansSkeleton } from "@/components/loans/loans-skeleton"
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
  "loanName:asc": "Name A–Z",
  "loanName:desc": "Name Z–A",
  "loanTargetAmt:desc": "Target: high to low",
  "loanTargetAmt:asc": "Target: low to high",
}

function formatDate(value) {
  if (!value) return "No due date"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "No due date"
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

function loanStatus(status) {
  const labels = {
    in_progress: "In progress",
    Overdue: "Overdue",
    Completed: "Completed",
    Cancelled: "Cancelled",
    Paused: "Paused",
    no_funds: "Needs funds",
  }
  return labels[status] ?? "In progress"
}

function categoryColor(category) {
  const hash = [...String(category || "General").toLowerCase()]
    .reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return `var(--chart-${(hash % 5) + 1})`
}

function termLabel(loan) {
  const storedDuration = Number(loan.duration) || 0
  const duration = loan.loanType === "Yearly" ? storedDuration / 12 : storedDuration
  const unit = loan.loanType === "Yearly" ? "year" : "month"
  return `${duration} ${duration === 1 ? unit : `${unit}s`}`
}

function hasPaidThisMonth(loan) {
  const lastDate = loan.deductionDates?.at(-1)
  return lastDate ? new Date(lastDate).getMonth() === new Date().getMonth() : false
}

function SummaryCard({ title, amount, description, icon: Icon, tone = "primary", currency }) {
  const toneClass = tone === "success"
    ? "bg-success/10 text-success"
    : "bg-primary/10 text-primary"

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

function LoansError({ onRetry }) {
  return (
    <Card className="border-destructive/20">
      <CardContent className="flex flex-col items-start gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
          <div>
            <p className="font-medium">We couldn’t load your loans</p>
            <p className="mt-1 text-sm text-muted-foreground">Please check your connection and try again.</p>
          </div>
        </div>
        <Button variant="outline" onClick={onRetry}>
          <RotateCw className="mr-2 size-4" aria-hidden="true" />Try again
        </Button>
      </CardContent>
    </Card>
  )
}

function LoanCard({ loan, currency, onEdit, onPay, onDelete }) {
  const target = Math.max(0, Number(loan.loanTargetAmt) || 0)
  const paid = Math.max(0, Number(loan.currentAmt) || 0)
  const remaining = Math.max(0, target - paid)
  const progress = target > 0 ? Math.min(100, (paid / target) * 100) : 0
  const category = loan.category || "General"
  const color = categoryColor(category)
  const status = loanStatus(loan.status)
  const statusVariant = loan.status === "Overdue" || loan.status === "no_funds"
    ? "destructive"
    : loan.status === "Completed"
      ? "secondary"
      : "outline"
  const atTermLimit = Number(loan.totalDeductions || 0) + 1 >= Number(loan.duration || 0)
  const canPay = !loan.autoDeduction && loan.status === "in_progress" && remaining > 0
  const paymentDisabledReason = loan.autoDeduction
    ? "Automatic repayments are enabled for this loan."
    : loan.status !== "in_progress"
      ? "Only in-progress loans can receive a manual payment."
      : remaining <= 0
        ? "This loan is fully paid."
        : hasPaidThisMonth(loan)
          ? "A manual payment has already been recorded this month."
          : atTermLimit
            ? "The scheduled term has ended. Edit the loan term to continue."
            : ""

  return (
    <article className="rounded-xl border border-border/80 bg-card p-4 transition-colors hover:bg-muted/15 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border" style={{ color, borderColor: `color-mix(in srgb, ${color} 35%, transparent)`, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}>
            <WalletCards className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="break-words text-base font-semibold leading-tight sm:text-lg">{loan.loanName || "Untitled loan"}</h3>
              <Badge variant={statusVariant}>{status}</Badge>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1" style={{ color }}><Tags className="size-3.5" aria-hidden="true" />{category}</span>
              <span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" aria-hidden="true" />{termLabel(loan)}</span>
              <span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" aria-hidden="true" />Due {formatDate(loan.dueDate)}</span>
              <span className="inline-flex items-center gap-1">{loan.autoDeduction ? <><CheckCircle2 className="size-3.5 text-primary" aria-hidden="true" />Automatic</> : <><HandCoins className="size-3.5" aria-hidden="true" />Manual</>}</span>
            </div>
          </div>
        </div>
        <p className="ml-auto whitespace-nowrap font-display text-xl font-semibold tabular-nums sm:text-2xl">
          {formatCurrency(target, currency)}
          <span className="ml-1 text-xs font-normal text-muted-foreground">target</span>
        </p>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-muted-foreground">Repayment progress</span>
          <span className="font-medium tabular-nums">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} aria-label={`${Math.round(progress)} percent repaid`} className="gap-0 [&_[data-slot=progress-track]]:h-2" />
        <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>Paid <strong className="font-semibold tabular-nums text-foreground">{formatCurrency(paid, currency)}</strong></span>
          <span>Remaining <strong className="font-semibold tabular-nums text-foreground">{formatCurrency(remaining, currency)}</strong></span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
        <span className="text-xs text-muted-foreground">
          {loan.autoDeduction ? "Automatic repayment" : `${Number(loan.totalDeductions) || 0} manual ${Number(loan.totalDeductions) === 1 ? "payment" : "payments"}`}
        </span>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {canPay && (
            <Button size="sm" variant="secondary" title={paymentDisabledReason || "Record a manual repayment"} onClick={() => onPay(loan)}>
              <HandCoins className="mr-1.5 size-4" aria-hidden="true" />Pay
            </Button>
          )}
          <Button variant="ghost" size="icon-lg" className="size-10 text-muted-foreground hover:bg-primary/10 hover:text-primary" aria-label={`Edit ${loan.loanName}`} title={`Edit ${loan.loanName}`} onClick={() => onEdit(loan)}>
            <Pencil className="size-4" aria-hidden="true" />
          </Button>
          <span aria-hidden="true" className="h-6 border-l border-border" />
          <Button variant="ghost" size="icon-lg" className="size-10 text-destructive/80 hover:bg-destructive/10 hover:text-destructive" aria-label={`Delete ${loan.loanName}`} title={`Delete ${loan.loanName}`} onClick={() => onDelete(loan)}>
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
      {!canPay && paymentDisabledReason && !loan.autoDeduction && loan.status === "in_progress" && remaining > 0 && (
        <p className="mt-2 text-right text-xs text-muted-foreground">{paymentDisabledReason}</p>
      )}
    </article>
  )
}

export function LoansPage() {
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState("")
  const [sort, setSort] = useState(DEFAULT_SORT)
  const [reloadKey, setReloadKey] = useState(0)
  const [editingLoan, setEditingLoan] = useState(null)
  const [payingLoan, setPayingLoan] = useState(null)
  const [deletingLoan, setDeletingLoan] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [listError, setListError] = useState(false)
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
  const cachedData = getCachedLoanPage(query)
  const visibleData = cachedData ?? data
  const loans = visibleData?.loans ?? []
  const categories = [...new Set((data?.loans ?? []).map((loan) => loan.category).filter(Boolean))].sort()

  useEffect(() => {
    let active = true
    const cached = getCachedLoanPage(query)

    if (cached) {
      setData(cached)
      hasLoadedRef.current = true
    }
    setLoading(!hasLoadedRef.current && !cached)
    setRefreshing(hasLoadedRef.current && !cached)
    setLoadError(false)
    setListError(false)

    getLoansPage(query, { forceRefresh: reloadKey > 0 })
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

  const changeSort = (value) => {
    setSort(value)
    setPage(1)
  }

  function refresh() {
    setReloadKey((current) => current + 1)
  }

  async function saveLoan(values) {
    if (editingLoan) await updateLoan(editingLoan._id, values)
    else {
      await createLoan(values)
      setPage(1)
    }
    setEditingLoan(null)
    refresh()
  }

  async function recordPayment(amount) {
    await makeLoanPayment(payingLoan._id, amount)
    if (loans.length === 1 && page > 1) setPage((current) => current - 1)
    else refresh()
    setPayingLoan(null)
  }

  async function removeLoan(reason) {
    await deleteLoan(deletingLoan._id, reason)
    if (loans.length === 1 && page > 1) setPage((current) => current - 1)
    else refresh()
    setDeletingLoan(null)
  }

  if (loading) return <LoansSkeleton />

  return (
    <div className="mx-auto max-w-7xl space-y-6 sm:space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">A steady plan for what you owe</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Loans</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Track repayments, see what remains, and keep every loan moving forward.</p>
        </div>
        {loans.length > 0 && (
          <Button onClick={() => { setEditingLoan(null); setFormOpen(true) }}>
            <Plus className="mr-2 size-4" aria-hidden="true" />Add loan
          </Button>
        )}
      </header>

      {loadError ? (
        <LoansError onRetry={refresh} />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2" aria-label="Loan repayment summary">
            <SummaryCard title="Total paid" amount={visibleData?.amountPaid ?? 0} description="Across active and archived loans" icon={CircleDollarSign} tone="success" currency={currency} />
            <SummaryCard title="Remaining to pay" amount={visibleData?.amountRemaining ?? 0} description="Outstanding across active loans" icon={Landmark} currency={currency} />
          </section>

          {loans.length === 0 && !category ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Banknote className="size-4 text-primary" aria-hidden="true" />Your loan plan</CardTitle>
                <CardDescription>Add a loan to see its target, repayment progress, and remaining amount here.</CardDescription>
              </CardHeader>
              <CardContent>
                <EmptyDataState
                  icon={WalletCards}
                  title="No loans yet"
                  description="Add your first loan to make a repayment plan and track what you have paid."
                  actionLabel="Add your first loan"
                  actionOnClick={() => { setEditingLoan(null); setFormOpen(true) }}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><WalletCards className="size-4 text-primary" aria-hidden="true" />Loan list</CardTitle>
                  <CardDescription className="mt-1">
                    {visibleData?.totalDoc ?? 0} {(visibleData?.totalDoc ?? 0) === 1 ? "loan" : "loans"}{category ? ` in ${category}` : " in your plan"}
                  </CardDescription>
                </div>
                <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
                  <Select value={category || ALL_CATEGORIES} onValueChange={(value) => { setCategory(value === ALL_CATEGORIES ? "" : value); setPage(1) }}>
                    <SelectTrigger className="h-9 min-w-0 w-full sm:w-[190px]" aria-label="Filter loans by category">
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
                  <Select value={sort} onValueChange={changeSort}>
                    <SelectTrigger className="h-9 min-w-0 w-full sm:w-[190px]" aria-label="Sort loans">
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
                {refreshing && <p role="status" className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">Updating your loans…</p>}
                {listError && (
                  <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Couldn’t refresh this list. Your last loaded loans are still shown.</span>
                    <Button size="sm" variant="outline" onClick={refresh}>Try again</Button>
                  </div>
                )}
                <div className={refreshing ? "space-y-3 opacity-60 transition-opacity" : "space-y-3 transition-opacity"}>
                  {loans.length === 0 ? (
                    <EmptyDataState icon={Tags} title={`No ${category} loans`} description="Choose another category or clear the filter to see all loans." className="min-h-[170px]" />
                  ) : loans.map((loan) => (
                    <LoanCard
                      key={loan._id}
                      loan={loan}
                      currency={currency}
                      onEdit={(selected) => { setEditingLoan(selected); setFormOpen(true) }}
                      onPay={setPayingLoan}
                      onDelete={setDeletingLoan}
                    />
                  ))}
                </div>

                {(visibleData?.totalPages ?? 0) > 1 && (
                  <div className="flex flex-col items-center gap-3 border-t border-border/70 pt-4 sm:flex-row sm:justify-between">
                    <p className="text-xs text-muted-foreground">Page {page} of {visibleData.totalPages}</p>
                    <Pagination className="mx-0 w-auto">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious href="#loans" aria-disabled={page <= 1} tabIndex={page <= 1 ? -1 : undefined} className={page <= 1 ? "pointer-events-none opacity-50" : ""} onClick={(event) => { event.preventDefault(); if (page > 1) setPage(page - 1) }} />
                        </PaginationItem>
                        {Array.from({ length: visibleData.totalPages }, (_, index) => index + 1).slice(Math.max(0, page - 2), Math.max(0, page - 2) + 5).map((pageNumber) => (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink href="#loans" isActive={pageNumber === page} aria-label={`Go to page ${pageNumber}`} onClick={(event) => { event.preventDefault(); setPage(pageNumber) }}>{pageNumber}</PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext href="#loans" aria-disabled={page >= visibleData.totalPages} tabIndex={page >= visibleData.totalPages ? -1 : undefined} className={page >= visibleData.totalPages ? "pointer-events-none opacity-50" : ""} onClick={(event) => { event.preventDefault(); if (page < visibleData.totalPages) setPage(page + 1) }} />
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
        <LoanFormDialog
          key={editingLoan?._id ?? "new-loan"}
          open
          onOpenChange={setFormOpen}
          loan={editingLoan}
          currency={currency}
          onSave={saveLoan}
        />
      )}
      {payingLoan && (
        <LoanPaymentDialog
          key={payingLoan._id}
          open
          onOpenChange={(open) => { if (!open) setPayingLoan(null) }}
          loan={payingLoan}
          currency={currency}
          onPay={recordPayment}
        />
      )}
      {deletingLoan && (
        <DeleteLoanDialog
          key={deletingLoan._id}
          open
          onOpenChange={(open) => { if (!open) setDeletingLoan(null) }}
          loan={deletingLoan}
          currency={currency}
          onDelete={removeLoan}
        />
      )}
    </div>
  )
}
