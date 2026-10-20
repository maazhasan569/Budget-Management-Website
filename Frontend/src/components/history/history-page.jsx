import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import {
  AlertCircle,
  ArrowDownLeft,
  Banknote,
  CheckSquare,
  CircleDollarSign,
  Eye,
  FileText,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  if (status.toLowerCase() === "delete" || status.toLowerCase() === "deleted") return "Deleted"
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function isImageAttachment(url = "") {
  try {
    return /\.(jpe?g|png|gif|webp)$/i.test(new URL(url).pathname)
  } catch {
    return /\.(jpe?g|png|gif|webp)(?:$|\?)/i.test(url)
  }
}

function getAttachmentName(url = "") {
  try {
    return decodeURIComponent(new URL(url).pathname.split("/").at(-1)) || "Task attachment"
  } catch {
    return url.split("/").at(-1)?.split("?")[0] || "Task attachment"
  }
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

const DETAIL_FIELDS = {
  expenses: [
    ["name", "Expense name"],
    ["amount", "Expense amount"],
    ["category", "Category"],
    ["deletionReason", "Removal reason"],
  ],
  loans: [
    ["loanName", "Loan name"],
    ["loanTargetAmt", "Original loan amount"],
    ["currentAmt", "Amount paid"],
    ["category", "Category"],
    ["loanType", "Payment frequency"],
    ["duration", "Term (months)"],
    ["dueDate", "Due date"],
    ["status", "Status"],
    ["autoDeduction", "Automatic payments"],
    ["totalDeductions", "Number of payments"],
    ["deductionDates", "Payment dates"],
    ["deletionReason", "Removal reason"],
  ],
  goals: [
    ["goalName", "Goal name"],
    ["targetAmount", "Target amount"],
    ["currentAmt", "Amount saved"],
    ["category", "Category"],
    ["type", "Contribution frequency"],
    ["duration", "Term (months)"],
    ["achievementDate", "Target date"],
    ["status", "Status"],
    ["autoDeduction", "Automatic contributions"],
    ["totalDeductions", "Number of contributions"],
    ["deductionDates", "Contribution dates"],
  ],
  tasks: [
    ["name", "Task name"],
    ["description", "Description"],
    ["category", "Category"],
    ["status", "Status"],
    ["dueDate", "Due date"],
    ["dueDateUnit", "Due date unit"],
  ],
}

function formatDetailValue(field, value) {
  if (value == null || value === "") return null
  if (field === "amount" || field === "loanTargetAmt" || field === "currentAmt" || field === "targetAmount") {
    return formatCurrency(value)
  }
  if (field === "status" || field === "deletionReason") {
    return formatStatus(String(value))
  }
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (Array.isArray(value)) {
    return value.map((item) => formatDetailValue("date", item)).filter(Boolean).join(", ") || null
  }
  if (field === "dueDate" || field === "achievementDate" || field === "date" || field === "deductionDates") {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        ...(field === "deductionDates" ? { timeStyle: "short" } : {}),
      }).format(date)
    }
  }
  if (field === "autoDeduction") return value ? "Yes" : "No"
  return String(value)
}

function HistoryRecordDetails({ item }) {
  if (!item) return null

  const fields = DETAIL_FIELDS[item.type]
    .map(([field, label]) => ({
      field,
      label,
      value: formatDetailValue(field, item.record[field]),
    }))
    .filter(({ value }) => value != null)

  return (
    <Dialog open onOpenChange={(open) => !open && item.onClose()}>
      <DialogContent className="history-dialog-scroll max-h-[85dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <item.icon className="size-5 text-primary" aria-hidden="true" />
            <DialogTitle className="font-display text-xl">
              {getRecordTitle(item.type, item.record)}
            </DialogTitle>
          </div>
          <DialogDescription>
            Full details saved for this {item.label.toLowerCase()}.
          </DialogDescription>
        </DialogHeader>

        {fields.length > 0 ? (
          <dl className="divide-y divide-border/70 rounded-xl border border-border/70 px-4">
            {fields.map(({ field, label, value }) => (
              <div key={field} className="grid gap-1 py-3 sm:grid-cols-[minmax(130px,0.7fr)_minmax(0,1.3fr)] sm:gap-4">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="break-words text-sm font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="rounded-xl border border-border/70 px-4 py-5 text-sm text-muted-foreground">
            No additional details were saved for this item.
          </p>
        )}

        {item.type === "tasks" && item.record.document && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Attachment</p>
            {isImageAttachment(item.record.document) && (
              <img
                src={item.record.document}
                alt={`Attachment for ${getRecordTitle(item.type, item.record)}`}
                className="max-h-64 w-full rounded-lg border border-border object-contain"
              />
            )}
            <a
              className="inline-flex text-sm text-primary hover:underline"
              href={item.record.document}
              target="_blank"
              rel="noreferrer"
            >
              Open attachment
            </a>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
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
  const navigate = useNavigate()
  const { recordType, recordId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1)
  const [historyResult, setHistoryResult] = useState({ requestKey: "", data: null, error: "" })
  const [reloadKey, setReloadKey] = useState(0)
  const requestKey = `${page}:${reloadKey}`

  useEffect(() => {
    let active = true

    getHistory({ page, limit: PAGE_SIZE })
      .then((result) => {
        if (active) {
          setHistoryResult({ requestKey, data: result, error: "" })
        }
      })
      .catch((requestError) => {
        if (active) {
          setHistoryResult({
            requestKey,
            data: null,
            error: requestError?.response?.data?.message ||
              requestError?.message ||
              "Check your connection and try again.",
          })
        }
      })

    return () => {
      active = false
    }
  }, [page, reloadKey, requestKey])

  const loading = historyResult.requestKey !== requestKey
  const error = loading ? "" : historyResult.error
  const historyPage = loading ? null : historyResult.data

  const records = useMemo(() => {
    if (!historyPage) return []
    return historyPage.records
      .map(({ type, record }, index) => {
        const metadata = HISTORY_TYPES.find(([historyType]) => historyType === type)
        if (!metadata) return null
        const [recordType, label, icon] = metadata
        return {
          type: recordType,
          label,
          icon,
          record,
          key: `${recordType}-${record._id ?? index}`,
          timestamp: getRecordTime(record._id),
        }
      })
      .filter(Boolean)
      .sort((left, right) => right.timestamp - left.timestamp)
  }, [historyPage])

  const totalPages = historyPage?.paginated
    ? historyPage.totalPages
    : Math.ceil((historyPage?.totalDoc ?? 0) / PAGE_SIZE)
  const totalRecords = historyPage?.totalDoc ?? records.length
  const visibleRecords = historyPage?.paginated
    ? records
    : records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const selectedRecord = records.find(
    (item) => item.type === recordType && String(item.record._id) === recordId,
  )
  const firstItem = totalRecords === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const lastItem = Math.min((page - 1) * PAGE_SIZE + visibleRecords.length, totalRecords)

  function goToPage(nextPage) {
    const normalizedPage = Math.max(1, Math.min(totalPages || 1, nextPage))
    const nextParams = new URLSearchParams(searchParams)
    if (normalizedPage === 1) nextParams.delete("page")
    else nextParams.set("page", String(normalizedPage))
    setSearchParams(nextParams)
  }

  function retry() {
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
            {totalRecords} {totalRecords === 1 ? "record" : "records"} saved
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {totalRecords === 0 ? (
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
                    <li key={key} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:py-5">
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
                            <div className="mt-2 flex items-center gap-2">
                              {isImageAttachment(record.document) ? (
                                <a
                                  href={record.document}
                                  target="_blank"
                                  rel="noreferrer"
                                  aria-label={`Open attachment for ${getRecordTitle(type, record)}`}
                                  className="block size-12 shrink-0 overflow-hidden rounded-md border border-border"
                                >
                                  <img
                                    src={record.document}
                                    alt=""
                                    className="size-full object-cover"
                                  />
                                </a>
                              ) : (
                                <FileText className="size-4 shrink-0 text-primary" aria-hidden="true" />
                              )}
                              <a
                                className="min-w-0 truncate text-sm text-primary hover:underline"
                                href={record.document}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {getAttachmentName(record.document)}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                        {amount && (
                          <span className="text-right text-sm font-semibold tabular-nums">
                            {type === "expenses" ? `Amount ${amount}` : amount}
                          </span>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const query = searchParams.toString()
                            navigate(`/history/${type}/${encodeURIComponent(record._id)}${query ? `?${query}` : ""}`)
                          }}
                          aria-label={`View full details for ${getRecordTitle(type, record)}`}
                        >
                          <Eye className="mr-1.5 size-4" aria-hidden="true" />
                          View
                        </Button>
                      </div>
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
                            goToPage(page - 1)
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
                                goToPage(pageNumber)
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
                            goToPage(page + 1)
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
      {selectedRecord && (
        <HistoryRecordDetails
          item={{
            ...selectedRecord,
            onClose: () => {
              const query = searchParams.toString()
              navigate(`/history${query ? `?${query}` : ""}`)
            },
          }}
        />
      )}
    </div>
  )
}
