import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  ArrowDownLeft,
  Banknote,
  CheckSquare,
  CircleDollarSign,
  RotateCw,
  Target,
} from "lucide-react"

import { getHistory } from "@/api/history/history"
import { HistorySkeleton } from "@/components/history/history-skeleton"
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { formatCurrency } from "@/lib/currency"

const PAGE_SIZE = 10
const HISTORY_TYPES = [
  ["expenses", "Expense", CircleDollarSign],
  ["loans", "Loan", Banknote],
  ["goals", "Goal", Target],
  ["tasks", "Task", CheckSquare],
]

function getRecordTime(id) {
  if (typeof id !== "string" || !/^[a-f\d]{24}$/i.test(id)) return 0
  return Number.parseInt(id.slice(0, 8), 16) * 1000
}

function formatStatus(status) {
  if (!status) return ""
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getRecordTitle(type, record) {
  if (type === "expenses") return record.name || "Expense"
  if (type === "loans") return record.loanName || "Loan"
  if (type === "goals") return record.goalName || "Goal"
  return record.name || "Task"
}

function getRecordDescription(type, record) {
  if (type === "expenses") {
    return record.deletionReason
      ? `Removed: ${formatStatus(record.deletionReason)}`
      : "Expense record"
  }
  if (type === "loans") {
    return [record.loanType, formatStatus(record.status)].filter(Boolean).join(" · ") || "Loan record"
  }
  if (type === "goals") {
    return [formatStatus(record.status), record.type].filter(Boolean).join(" · ") || "Goal record"
  }
  return [record.description, formatStatus(record.status)].filter(Boolean).join(" · ") || "Task record"
}

function getRecordAmount(type, record) {
  if (type === "expenses" && Number.isFinite(Number(record.amount))) {
    return `−${formatCurrency(record.amount)}`
  }
  if (type === "goals" && Number.isFinite(Number(record.targetAmount))) {
    return `Target ${formatCurrency(record.targetAmount)}`
  }
  return ""
}

function getVisiblePages(currentPage, totalPages) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const first = Math.max(1, Math.min(currentPage - 1, totalPages - 4))
  const pages = Array.from({ length: 5 }, (_, index) => first + index)

  if (first > 1) pages.unshift("start-ellipsis")
  if (first + 4 < totalPages) pages.push("end-ellipsis")
  return pages
}

function HistoryError({ message, onRetry }) {
  return (
    <Card className="border-destructive/20">
      <CardContent className="flex flex-col items-start gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
          <div>
            <p className="font-medium">We couldn’t load your history</p>
            <p className="mt-1 text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
        <Button variant="outline" onClick={onRetry}>
          <RotateCw className="mr-2 size-4" aria-hidden="true" />
          Try again
        </Button>
      </CardContent>
    </Card>
  )
}

export function HistoryPageContent() {
  const [history, setHistory] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true

    getHistory()
      .then((result) => {
        if (active) {
          setHistory(result)
          setPage(1)
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError?.response?.data?.message ||
              requestError?.message ||
              "Check your connection and try again.",
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  const records = useMemo(() => {
    if (!history) return []

    return HISTORY_TYPES.flatMap(([type, label, icon]) =>
      history[type].map((record, index) => ({
        type,
        label,
        icon,
        record,
        key: `${type}-${record._id ?? index}`,
        timestamp: getRecordTime(record._id),
      })),
    ).sort((left, right) => right.timestamp - left.timestamp)
  }, [history])

  const totalPages = Math.ceil(records.length / PAGE_SIZE)
  const visibleRecords = records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const firstItem = records.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const lastItem = Math.min(page * PAGE_SIZE, records.length)

  function retry() {
    setError("")
    setLoading(true)
    setReloadKey((key) => key + 1)
  }

  if (loading) return <HistorySkeleton />
  if (error) {
    return (
      <div className="mx-auto max-w-7xl space-y-7">
        <header>
          <p className="mb-2 text-sm font-medium text-primary">A record of completed activity</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">History</h1>
        </header>
        <HistoryError message={error} onRetry={retry} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <header>
        <p className="mb-2 text-sm font-medium text-primary">A record of completed activity</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">History</h1>
        <p className="mt-2 text-muted-foreground">
          Review items you’ve completed or moved out of your active lists.
        </p>
      </header>

      <Card>
        <CardHeader className="border-b border-border/70">
          <CardTitle className="flex items-center gap-2">
            <ArrowDownLeft className="size-4 text-primary" aria-hidden="true" />
            Activity history
          </CardTitle>
          <CardDescription>
            {records.length} {records.length === 1 ? "record" : "records"} saved
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {records.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ArrowDownLeft className="size-6" aria-hidden="true" />
              </div>
              <h2 className="mt-4 font-semibold">Your history is empty</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Completed and removed items will appear here.
              </p>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-border/70 px-5">
                {visibleRecords.map(({ type, label, icon: Icon, record, key }) => {
                  const amount = getRecordAmount(type, record)
                  return (
                    <li key={key} className="flex items-center justify-between gap-4 py-4 sm:py-5">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="size-5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="break-words font-medium">{getRecordTitle(type, record)}</h2>
                            <Badge variant="outline">{label}</Badge>
                          </div>
                          <p className="mt-1 break-words text-sm text-muted-foreground">
                            {getRecordDescription(type, record)}
                          </p>
                          {type === "tasks" && record.document && (
                            <a
                              className="mt-1 inline-block text-sm text-primary hover:underline"
                              href={record.document}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View attachment
                            </a>
                          )}
                        </div>
                      </div>
                      {amount && (
                        <span className="shrink-0 text-right text-sm font-medium tabular-nums">
                          {amount}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>

              {totalPages > 1 && (
                <div className="flex flex-col gap-4 border-t border-border/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground" aria-live="polite">
                    Showing {firstItem}–{lastItem} of {records.length}
                  </p>
                  <Pagination className="mx-0 w-auto">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#history"
                          aria-disabled={page === 1}
                          tabIndex={page === 1 ? -1 : undefined}
                          className={page === 1 ? "pointer-events-none opacity-50" : ""}
                          onClick={(event) => {
                            event.preventDefault()
                            setPage((current) => Math.max(1, current - 1))
                          }}
                        />
                      </PaginationItem>
                      {getVisiblePages(page, totalPages).map((pageNumber) => (
                        <PaginationItem key={pageNumber}>
                          {typeof pageNumber === "number" ? (
                            <PaginationLink
                              href="#history"
                              isActive={pageNumber === page}
                              aria-label={`Go to page ${pageNumber}`}
                              onClick={(event) => {
                                event.preventDefault()
                                setPage(pageNumber)
                              }}
                            >
                              {pageNumber}
                            </PaginationLink>
                          ) : (
                            <PaginationEllipsis />
                          )}
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          href="#history"
                          aria-disabled={page === totalPages}
                          tabIndex={page === totalPages ? -1 : undefined}
                          className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                          onClick={(event) => {
                            event.preventDefault()
                            setPage((current) => Math.min(totalPages, current + 1))
                          }}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
