import { useEffect, useMemo, useState } from "react"
import {
  ArrowDownWideNarrow,
  ArrowUpDown,
  CalendarDays,
  CircleAlert,
  CircleDollarSign,
  Pencil,
  Plus,
  ReceiptText,
  RotateCw,
  Tags,
  Trash2,
  Wallet,
} from "lucide-react"

import {
  createExpense,
  deleteExpense,
  getAllExpenseCategories,
  getExpenses,
  updateExpense,
} from "@/api/expenses/expenses"
import { EmptyDataState } from "@/components/dashboard/empty-data-state"
import { ExpensesSkeleton } from "@/components/expenses/expenses-skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

const PAGE_SIZE = 8
const FRIENDLY_LOAD_ERROR = "We couldn’t load your expenses. Please try again."
const FRIENDLY_SAVE_ERROR = "Could not save your expense. Please check the name and amount, then try again."
const FRIENDLY_DELETE_ERROR = "Could not remove this expense. Please check your answers and try again."
const ALL_CATEGORIES = "__all_categories__"

function formatAmount(value) {
  const amount = Number(value)
  return Number.isFinite(amount)
    ? new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(amount)
    : "—"
}

function formatDate(value) {
  if (!value) return "Date unavailable"
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date)
}

function ExpenseFormDialog({ open, onOpenChange, expense, categories, onSave }) {
  const editing = Boolean(expense)
  const [name, setName] = useState(expense?.name ?? "")
  const [amount, setAmount] = useState(expense?.amount == null ? "" : String(expense.amount))
  const [category, setCategory] = useState(expense?.category && expense.category !== "General" ? expense.category : "")
  const [formError, setFormError] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const cleanName = name.trim()
    const parsedAmount = Number(amount)
    if (!cleanName) {
      setFormError("Enter a name for this expense.")
      return
    }
    if (!amount.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError("Enter an amount greater than zero.")
      return
    }

    setSaving(true)
    setFormError("")
    try {
      await onSave({
        name: cleanName,
        amount: parsedAmount,
        ...(category.trim() ? { category: category.trim() } : {}),
      })
      onOpenChange(false)
    } catch {
      setFormError(FRIENDLY_SAVE_ERROR)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !saving && onOpenChange(nextOpen)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{editing ? "Edit expense" : "Add an expense"}</DialogTitle>
          <DialogDescription>
            {editing ? "Update the details so your spending stays accurate." : "Record a purchase against your budget."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expense-name">Expense name</Label>
            <Input
              id="expense-name"
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Weekly groceries"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="expense-amount">Amount</Label>
              <Input
                id="expense-amount"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="any"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-category">Category <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input
                id="expense-category"
                list="expense-category-options"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="General"
              />
              <datalist id="expense-category-options">
                {categories.map((option) => <option key={option} value={option} />)}
              </datalist>
            </div>
          </div>
          {formError && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Add expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteExpenseDialog({ expense, open, onOpenChange, onDelete }) {
  const [ans1, setAns1] = useState("Yes")
  const [ans2, setAns2] = useState("No")
  const [formError, setFormError] = useState("")
  const [deleting, setDeleting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!expense?._id) return
    setDeleting(true)
    setFormError("")
    try {
      await onDelete(expense._id, { ans1, ans2 })
      onOpenChange(false)
    } catch {
      setFormError(FRIENDLY_DELETE_ERROR)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !deleting && onOpenChange(nextOpen)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Remove this expense?</DialogTitle>
          <DialogDescription>
            Tell us what happened so Finch can apply the backend’s budget and history rules for “{expense?.name}”.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Did money leave your account for this?</legend>
            <div className="flex gap-2">
              {["Yes", "No"].map((answer) => (
                <Button key={answer} type="button" size="sm" variant={ans1 === answer ? "secondary" : "outline"} aria-pressed={ans1 === answer} onClick={() => setAns1(answer)}>{answer}</Button>
              ))}
            </div>
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Did you receive a refund?</legend>
            <div className="flex gap-2">
              {["Yes", "No"].map((answer) => (
                <Button key={answer} type="button" size="sm" variant={ans2 === answer ? "secondary" : "outline"} aria-pressed={ans2 === answer} onClick={() => setAns2(answer)}>{answer}</Button>
              ))}
            </div>
          </fieldset>
          <p className="text-xs leading-relaxed text-muted-foreground">Your answers determine whether the expense is archived and whether its amount is returned to your remaining budget.</p>
          {formError && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>Cancel</Button>
            <Button type="submit" variant="destructive" disabled={deleting}>
              <Trash2 className="mr-2 size-4" aria-hidden="true" />{deleting ? "Removing…" : "Confirm removal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ExpenseRow({ expense, onEdit, onDelete }) {
  return (
    <article className="group grid gap-3 rounded-xl border border-border/80 p-4 transition-colors hover:bg-muted/30 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ReceiptText className="size-[18px]" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium">{expense.name || "Untitled expense"}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" aria-hidden="true" />{formatDate(expense.createdAt)}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <Badge variant="secondary" className="max-w-40 truncate font-normal"><Tags className="mr-1" aria-hidden="true" />{expense.category || "General"}</Badge>
        <p className="whitespace-nowrap font-semibold tabular-nums">{formatAmount(expense.amount)}</p>
      </div>
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="icon" aria-label={`Edit ${expense.name}`} onClick={() => onEdit(expense)}>
          <Pencil className="size-4" aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="icon" aria-label={`Remove ${expense.name}`} className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => onDelete(expense)}>
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </article>
  )
}

function ExpensesError({ onRetry }) {
  return (
    <Card className="border-destructive/20">
      <CardContent className="flex flex-col items-start gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <CircleAlert className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
          <div>
            <p className="font-medium">Something went wrong</p>
            <p className="mt-1 text-sm text-muted-foreground">{FRIENDLY_LOAD_ERROR}</p>
          </div>
        </div>
        <Button variant="outline" onClick={onRetry}><RotateCw className="mr-2 size-4" aria-hidden="true" />Try again</Button>
      </CardContent>
    </Card>
  )
}

export function ExpensesPage() {
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [category, setCategory] = useState("")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortType, setSortType] = useState("desc")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [deletingExpense, setDeletingExpense] = useState(null)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setLoadFailed(false)
      try {
        const [result, availableCategories] = await Promise.all([
          getExpenses({ page, limit: PAGE_SIZE, sortBy, sortType, category: category || undefined }),
          getAllExpenseCategories().catch(() => []),
        ])
        if (!active) return
        if (result.expenses.length === 0 && page > 1 && result.totalPages > 0 && page > result.totalPages) {
          setPage(result.totalPages)
          return
        }
        setExpenses(result.expenses)
        setTotalPages(result.totalPages)
        setTotalExpenses(result.totalDoc)
        setCategories(availableCategories)
      } catch {
        if (active) setLoadFailed(true)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [category, page, sortBy, sortType, reloadKey])

  const visibleTotal = useMemo(
    () => expenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0),
    [expenses],
  )

  async function saveExpense(values) {
    if (editingExpense) {
      await updateExpense(editingExpense._id, values)
    } else {
      await createExpense(values)
      setPage(1)
    }
    setEditingExpense(null)
    setReloadKey((key) => key + 1)
  }

  async function removeExpense(expenseId, answers) {
    await deleteExpense(expenseId, answers)
    if (expenses.length === 1 && page > 1) setPage((current) => current - 1)
    else setReloadKey((key) => key + 1)
  }

  function changeCategory(value) {
    setCategory(value)
    setPage(1)
  }

  function changeSort(value) {
    const [nextSortBy, nextSortType] = value.split(":")
    setSortBy(nextSortBy)
    setSortType(nextSortType)
    setPage(1)
  }

  if (loading) return <ExpensesSkeleton />
  if (loadFailed) {
    return (
      <div className="mx-auto max-w-7xl space-y-7">
        <header>
          <p className="mb-2 text-sm font-medium text-primary">Your spending, organized</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Expenses</h1>
        </header>
        <ExpensesError onRetry={() => setReloadKey((key) => key + 1)} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Your spending, organized</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Expenses</h1>
          <p className="mt-2 text-muted-foreground">Keep every purchase in view and understand where your money goes.</p>
        </div>
        {expenses.length > 0 && (
          <Button onClick={() => { setEditingExpense(null); setFormOpen(true) }}>
            <Plus className="mr-2 size-4" aria-hidden="true" />Add expense
          </Button>
        )}
      </header>

      {expenses.length === 0 && !category ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wallet className="size-4 text-primary" aria-hidden="true" />Your expense log</CardTitle>
            <CardDescription>Every purchase you record will appear here.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyDataState
              icon={CircleDollarSign}
              title="No expenses yet"
              description="Add your first expense to start seeing where your money goes."
              actionLabel="Add your first expense"
              actionOnClick={() => { setEditingExpense(null); setFormOpen(true) }}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><ReceiptText className="size-4 text-primary" aria-hidden="true" />Expense log</CardTitle>
              <CardDescription className="mt-1">
                {totalExpenses} {totalExpenses === 1 ? "expense" : "expenses"}{category ? ` in ${category}` : " recorded"}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={category || ALL_CATEGORIES}
                onValueChange={(value) => changeCategory(value === ALL_CATEGORIES ? "" : value)}
              >
                <SelectTrigger className="h-10 w-full px-3 sm:w-[240px]" aria-label="Filter expenses by category">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent className="p-1.5">
                  <SelectGroup>
                    <SelectLabel>Categories</SelectLabel>
                    <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
                    {categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select value={`${sortBy}:${sortType}`} onValueChange={changeSort}>
                <SelectTrigger className="h-10 w-full px-3 sm:w-[220px]" aria-label="Sort expenses">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="p-1.5">
                  <SelectGroup>
                    <SelectLabel>Sort by</SelectLabel>
                    <SelectItem value="createdAt:desc">Newest first</SelectItem>
                    <SelectItem value="createdAt:asc">Oldest first</SelectItem>
                    <SelectItem value="amount:desc">Amount: high to low</SelectItem>
                    <SelectItem value="amount:asc">Amount: low to high</SelectItem>
                    <SelectItem value="name:asc">Name: A to Z</SelectItem>
                    <SelectItem value="name:desc">Name: Z to A</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {expenses.length === 0 ? (
              <EmptyDataState
                icon={Tags}
                title={`No ${category} expenses`}
                description="Try another category or clear the filter to see all expenses."
                className="min-h-[170px]"
              />
            ) : (
              <>
                <div className="mb-2 flex items-center justify-between gap-3 rounded-xl bg-muted/45 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {sortBy === "amount" ? <ArrowDownWideNarrow className="size-4" aria-hidden="true" /> : <ArrowUpDown className="size-4" aria-hidden="true" />}
                    <span>Showing {expenses.length} of {totalExpenses}</span>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">Page total <span className="ml-1">{formatAmount(visibleTotal)}</span></p>
                </div>
                <div className="space-y-2.5">
                  {expenses.map((expense) => (
                    <ExpenseRow
                      key={expense._id}
                      expense={expense}
                      onEdit={(selected) => { setEditingExpense(selected); setFormOpen(true) }}
                      onDelete={setDeletingExpense}
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex flex-col items-center gap-3 border-t border-border/70 pt-4 sm:flex-row sm:justify-between">
                    <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
                    <Pagination className="mx-0 w-auto">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious href="#expenses" aria-disabled={page <= 1} tabIndex={page <= 1 ? -1 : undefined} className={page <= 1 ? "pointer-events-none opacity-50" : ""} onClick={(event) => { event.preventDefault(); if (page > 1) setPage(page - 1) }} />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, index) => index + 1).slice(Math.max(0, page - 2), Math.max(0, page - 2) + 5).map((pageNumber) => (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink href="#expenses" isActive={pageNumber === page} aria-label={`Go to page ${pageNumber}`} onClick={(event) => { event.preventDefault(); setPage(pageNumber) }}>{pageNumber}</PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext href="#expenses" aria-disabled={page >= totalPages} tabIndex={page >= totalPages ? -1 : undefined} className={page >= totalPages ? "pointer-events-none opacity-50" : ""} onClick={(event) => { event.preventDefault(); if (page < totalPages) setPage(page + 1) }} />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {formOpen && (
        <ExpenseFormDialog
          key={editingExpense?._id ?? "new-expense"}
          open
          onOpenChange={setFormOpen}
          expense={editingExpense}
          categories={categories}
          onSave={saveExpense}
        />
      )}
      {deletingExpense && (
        <DeleteExpenseDialog
          key={deletingExpense._id}
          expense={deletingExpense}
          open
          onOpenChange={(open) => { if (!open) setDeletingExpense(null) }}
          onDelete={removeExpense}
        />
      )}
    </div>
  )
}
