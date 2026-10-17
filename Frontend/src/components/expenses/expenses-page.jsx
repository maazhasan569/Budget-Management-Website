import { useEffect, useMemo, useRef, useState } from "react"
import {
  BookOpen,
  Car,
  CalendarDays,
  CircleAlert,
  CircleDollarSign,
  Fuel,
  HeartPulse,
  Pencil,
  Plane,
  Plus,
  ReceiptText,
  RotateCw,
  Shirt,
  ShoppingCart,
  Tags,
  Trash2,
  Utensils,
  Wallet,
  WalletCards,
  Zap,
} from "lucide-react"

import {
  createExpense,
  deleteExpense,
  getCachedExpenseCategories,
  getCachedExpenses,
  getAllExpenseCategories,
  getExpenses,
  updateExpense,
} from "@/api/expenses/expenses"
import { EmptyDataState } from "@/components/dashboard/empty-data-state"
import { ExpensesSkeleton } from "@/components/expenses/expenses-skeleton"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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
const FRIENDLY_LOAD_ERROR = "We couldn’t load your expenses. Please try again."
const FRIENDLY_SAVE_ERROR = "Could not save your expense. Please check the name and amount, then try again."
const FRIENDLY_DELETE_ERROR = "Could not remove this expense. Please check your answers and try again."
const ALL_CATEGORIES = "__all_categories__"

const CATEGORY_ICON_RULES = [
  { terms: ["car", "auto", "vehicle", "transport"], icon: Car },
  { terms: ["fuel", "gas", "petrol"], icon: Fuel },
  { terms: ["grocer", "grocery", "shopping", "market", "store"], icon: ShoppingCart },
  { terms: ["food", "dining", "restaurant", "cafe"], icon: Utensils },
  { terms: ["utility", "electric", "power", "water", "bill"], icon: Zap },
  { terms: ["health", "medical", "pharmacy"], icon: HeartPulse },
  { terms: ["travel", "flight", "air"], icon: Plane },
  { terms: ["education", "school", "book"], icon: BookOpen },
  { terms: ["clothing", "clothes", "apparel", "fashion"], icon: Shirt },
]

const SORT_LABELS = {
  "createdAt:desc": "Newest",
  "createdAt:asc": "Oldest",
  "amount:desc": "High to low",
  "amount:asc": "Low to high",
  "name:asc": "Name A–Z",
  "name:desc": "Name Z–A",
}

function categoryColor(category) {
  const hash = [...String(category || "General").toLowerCase()]
    .reduce((value, character) => value + character.charCodeAt(0), 0)
  return `var(--chart-${(hash % 5) + 1})`
}

function formatDate(value) {
  if (!value) return "Date unavailable"
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date)
}

function ExpenseFormDialog({ open, onOpenChange, expense, categories, currency, onSave }) {
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
    } catch (error) {
      setFormError(error?.message || FRIENDLY_SAVE_ERROR)
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
              <Label htmlFor="expense-amount">Amount{currency ? ` · ${currency}` : ""}</Label>
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
  const [deletionReason, setDeletionReason] = useState("")
  const [formError, setFormError] = useState("")
  const [deleting, setDeleting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!expense?._id) return
    if (!deletionReason) {
      setFormError("Choose the reason that best describes this expense.")
      return
    }

    setDeleting(true)
    setFormError("")
    try {
      await onDelete(expense._id, { ans: deletionReason })
      onOpenChange(false)
    } catch (error) {
      setFormError(error?.message || FRIENDLY_DELETE_ERROR)
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
            Choose why you’re removing “{expense?.name}”. This helps keep your history and remaining budget accurate.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium">Why are you removing this expense?</legend>
            <RadioGroup
              value={deletionReason}
              onValueChange={(value) => {
                setDeletionReason(value)
                setFormError("")
              }}
              aria-label="Expense deletion reason"
            >
              {[
                "I added it by mistake",
                "I paid, but got a refund",
                "I paid and didn't get a refund",
              ].map((reason) => (
                <Label
                  key={reason}
                  htmlFor={`expense-delete-reason-${reason}`}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 px-3 py-3 font-normal transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <RadioGroupItem
                    id={`expense-delete-reason-${reason}`}
                    value={reason}
                    disabled={deleting}
                    className="mt-0.5"
                  />
                  <span className="space-y-1">
                    <span className="block text-sm font-medium text-foreground">{reason}</span>
                    <span className="block text-xs leading-relaxed text-muted-foreground">
                      {reason === "I paid and didn't get a refund"
                        ? "The amount stays deducted from your remaining budget."
                        : "The amount is returned to your remaining budget."}
                    </span>
                  </span>
                </Label>
              ))}
            </RadioGroup>
          </fieldset>
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

function ExpenseRow({ expense, currency, onEdit, onDelete }) {
  const category = expense.category || "General"
  const normalizedCategory = category.toLowerCase()
  const Icon = CATEGORY_ICON_RULES.find(({ terms }) =>
    terms.some((term) => normalizedCategory.includes(term))
  )?.icon ?? (normalizedCategory === "general" ? Tags : WalletCards)
  const color = categoryColor(category)
  const categoryStyle = {
    color,
    backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
    borderColor: `color-mix(in srgb, ${color} 32%, transparent)`,
  }

  return (
    <article className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1.5 rounded-xl border border-border/80 bg-card p-3 transition-colors hover:bg-muted/30 sm:p-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl" style={{ ...categoryStyle, backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)` }}>
          <Icon className="size-[18px]" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="break-words text-base font-semibold leading-tight sm:text-[17px]">{expense.name || "Untitled expense"}</p>
          <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="inline-flex max-w-full items-center rounded-full border px-2 py-0.5 text-xs font-medium" style={categoryStyle}>
              {category}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5" aria-hidden="true" />{formatDate(expense.createdAt)}
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <p className="whitespace-nowrap text-base font-semibold tabular-nums text-foreground sm:text-lg">
          {formatCurrency(Math.abs(Number(expense.amount)), currency)}
        </p>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-10 text-muted-foreground hover:bg-primary/10 hover:text-primary" aria-label={`Edit ${expense.name}`} title={`Edit ${expense.name}`} onClick={() => onEdit(expense)}>
          <Pencil className="size-4" aria-hidden="true" />
          </Button>
          <span aria-hidden="true" className="h-6 border-l border-border" />
          <Button variant="ghost" size="icon" className="size-10 text-destructive/80 hover:bg-destructive/10 hover:text-destructive" aria-label={`Delete ${expense.name}`} title={`Delete ${expense.name}`} onClick={() => onDelete(expense)}>
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        </div>
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
  const initialQuery = { page: 1, limit: PAGE_SIZE, sortBy: "createdAt", sortType: "desc" }
  const initialExpenses = getCachedExpenses(initialQuery)
  const [expenses, setExpenses] = useState(initialExpenses?.expenses ?? [])
  const [categories, setCategories] = useState(getCachedExpenseCategories() ?? [])
  const [currency] = useState(getSelectedCurrency)
  const [category, setCategory] = useState("")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortType, setSortType] = useState("desc")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(initialExpenses?.totalPages ?? 0)
  const [totalExpenses, setTotalExpenses] = useState(initialExpenses?.totalDoc ?? 0)
  const [loading, setLoading] = useState(!initialExpenses)
  const [listRefreshing, setListRefreshing] = useState(false)
  const [listFailed, setListFailed] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [deletingExpense, setDeletingExpense] = useState(null)
  const hasLoadedRef = useRef(Boolean(initialExpenses))

  useEffect(() => {
    let active = true
    const query = { page, limit: PAGE_SIZE, sortBy, sortType, category: category || undefined }
    const cachedResult = getCachedExpenses(query)
    const isFirstLoad = !hasLoadedRef.current

    if (cachedResult) {
      hasLoadedRef.current = true
    }

    setLoading(isFirstLoad && !cachedResult)
    setListRefreshing(!isFirstLoad && !cachedResult)
    setListFailed(false)
    setLoadFailed(false)

    async function load() {
      try {
        const [result, availableCategories] = await Promise.all([
          getExpenses(query),
          getAllExpenseCategories().catch(() => []),
        ])
        if (!active) return
        hasLoadedRef.current = true
        if (result.expenses.length === 0 && page > 1 && result.totalPages > 0 && page > result.totalPages) {
          setPage(result.totalPages)
          return
        }
        setExpenses(result.expenses)
        setTotalPages(result.totalPages)
        setTotalExpenses(result.totalDoc)
        setCategories(availableCategories)
        setLoadFailed(false)
        setListFailed(false)
      } catch {
        if (active) {
          if (hasLoadedRef.current) setListFailed(true)
          else setLoadFailed(true)
        }
      } finally {
        if (active) {
          setLoading(false)
          setListRefreshing(false)
        }
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
        <CardHeader className="flex flex-col gap-3 border-b border-border/70 pb-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><ReceiptText className="size-4 text-primary" aria-hidden="true" />Expense log</CardTitle>
              <CardDescription className="mt-1">
                {totalExpenses} {totalExpenses === 1 ? "expense" : "expenses"}{category ? ` in ${category}` : " recorded"}
              </CardDescription>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
              <Select
                value={category || ALL_CATEGORIES}
                onValueChange={(value) => changeCategory(value === ALL_CATEGORIES ? "" : value)}
              >
                <SelectTrigger className="h-9 min-w-0 w-full px-2.5 text-xs sm:w-[220px] sm:px-3 sm:text-sm" aria-label="Filter expenses by category">
                  <SelectValue>{category || "All categories"}</SelectValue>
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
                <SelectTrigger className="h-9 min-w-0 w-full px-2.5 text-xs sm:w-[160px] sm:px-3 sm:text-sm" aria-label="Sort expenses">
                  <SelectValue>{SORT_LABELS[`${sortBy}:${sortType}`]}</SelectValue>
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
          <CardContent className="space-y-3 pt-3" aria-busy={listRefreshing}>
            {listRefreshing && (
              <p role="status" className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                Updating expense list…
              </p>
            )}
            {listFailed && (
              <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Couldn’t update this expense list. Your last loaded results are still shown.</span>
                <Button size="sm" variant="outline" onClick={() => setReloadKey((key) => key + 1)}>Try again</Button>
              </div>
            )}
            <div className={listRefreshing ? "opacity-60 transition-opacity" : "transition-opacity"}>
            {expenses.length === 0 ? (
              <EmptyDataState
                icon={Tags}
                title={`No ${category} expenses`}
                description="Try another category or clear the filter to see all expenses."
                className="min-h-[170px]"
              />
            ) : (
              <>
                <div className="mb-1 flex items-center justify-end gap-3 rounded-xl bg-muted/45 px-3 py-2.5 sm:px-4">
                  {totalPages > 1 && (
                    <p className="mr-auto text-xs text-muted-foreground">Page {page} of {totalPages}</p>
                  )}
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Current page total</span>
                    <span className="text-xl font-bold tabular-nums text-foreground sm:text-2xl">{formatCurrency(visibleTotal, currency)}</span>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {expenses.map((expense) => (
                    <ExpenseRow
                      key={expense._id}
                      expense={expense}
                      currency={currency}
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
            </div>
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
          currency={currency}
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
