import { useEffect, useState } from "react"
import { AlertCircle, RotateCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { formatCurrency } from "@/lib/currency"

const RECORD_FIELDS = {
  expenses: [
    ["name", "Expense name"],
    ["amount", "Amount"],
    ["category", "Category"],
    ["createdAt", "Date"],
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

const RECORD_TITLES = {
  expenses: (record) => record.name || "Expense details",
  loans: (record) => record.loanName || "Loan details",
  goals: (record) => record.goalName || "Goal details",
  tasks: (record) => record.name || "Task details",
}

function formatValue(field, value) {
  if (value == null || value === "") return null
  if (["amount", "loanTargetAmt", "currentAmt", "targetAmount"].includes(field)) {
    return formatCurrency(value)
  }
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (field === "status") {
    return String(value).replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
  }
  if (Array.isArray(value)) {
    return value.map((item) => formatValue("date", item)).filter(Boolean).join(", ")
  }
  if (["createdAt", "dueDate", "achievementDate", "date"].includes(field)) {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        ...(field === "date" ? { timeStyle: "short" } : {}),
      }).format(date)
    }
  }
  return String(value)
}

export function RecordRouteDialog({ id, type, getRecord, onClose }) {
  const [result, setResult] = useState({ requestKey: "", record: null, error: "" })
  const [retryKey, setRetryKey] = useState(0)
  const requestKey = `${id}:${retryKey}`

  useEffect(() => {
    let active = true

    getRecord(id)
      .then((result) => {
        if (!result) throw new Error("This record could not be found.")
        if (active) setResult({ requestKey, record: result, error: "" })
      })
      .catch((requestError) => {
        if (active) {
          setResult({
            requestKey,
            record: null,
            error: requestError?.response?.data?.message ||
              requestError?.message ||
              "Could not load this record.",
          })
        }
      })

    return () => {
      active = false
    }
  }, [getRecord, id, requestKey])

  const loading = result.requestKey !== requestKey
  const record = loading ? null : result.record
  const error = loading ? "" : result.error

  const fields = record
    ? (RECORD_FIELDS[type] ?? [])
        .map(([field, label]) => ({ field, label, value: formatValue(field, record[field]) }))
        .filter(({ value }) => value != null)
    : []

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {record ? RECORD_TITLES[type]?.(record) : "Record details"}
          </DialogTitle>
          <DialogDescription>
            {loading ? "Loading the selected record…" : `Details for this ${type.slice(0, -1)}.`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10"><Spinner className="size-6 text-primary" /></div>
        ) : error ? (
          <div role="alert" className="space-y-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
            <p className="flex items-start gap-2 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
            <Button size="sm" variant="outline" onClick={() => setRetryKey((key) => key + 1)}>
              <RotateCw className="mr-2 size-4" aria-hidden="true" />Try again
            </Button>
          </div>
        ) : (
          <>
            {fields.length > 0 ? (
              <dl className="divide-y divide-border/70 rounded-xl border border-border/70 px-4">
                {fields.map(({ field, label, value }) => (
                  <div key={field} className="grid gap-1 py-3 sm:grid-cols-[minmax(130px,0.7fr)_minmax(0,1.3fr)] sm:gap-4">
                    <dt className="text-sm text-muted-foreground">{label}</dt>
                    <dd className="break-words whitespace-pre-wrap text-sm font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="rounded-xl border border-border/70 px-4 py-5 text-sm text-muted-foreground">
                No additional details are available for this record.
              </p>
            )}
            {type === "tasks" && record.document && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Attachment</p>
                <a className="text-sm text-primary hover:underline" href={record.document} target="_blank" rel="noreferrer">
                  Open task attachment
                </a>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
