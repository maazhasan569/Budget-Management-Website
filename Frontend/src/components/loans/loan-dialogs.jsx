import { useState } from "react"
import { CircleDollarSign, HandCoins, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
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
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency } from "@/lib/currency"

const DELETION_REASONS = [
  ["created_by_mistake", "Created by mistake"],
  ["no_longer_needed", "No longer needed"],
  ["found_alternative", "Found an alternative"],
  ["personal_reason", "Personal reason"],
  ["other", "Other"],
]

function getDurationForForm(loan) {
  const duration = Number(loan?.duration)
  if (!Number.isFinite(duration)) return ""
  return String(loan?.loanType === "Yearly" ? duration / 12 : duration)
}

export function LoanFormDialog({ open, onOpenChange, loan, currency, onSave }) {
  const editing = Boolean(loan)
  const [name, setName] = useState(loan?.loanName ?? "")
  const [targetAmount, setTargetAmount] = useState(
    loan?.loanTargetAmt == null ? "" : String(loan.loanTargetAmt),
  )
  const [duration, setDuration] = useState(getDurationForForm(loan))
  const [loanType, setLoanType] = useState(loan?.loanType ?? "Monthly")
  const [category, setCategory] = useState(loan?.category === "General" ? "" : loan?.category ?? "")
  const [autoDeduction, setAutoDeduction] = useState(Boolean(loan?.autoDeduction))
  const [formError, setFormError] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const cleanName = name.trim()
    const amount = Number(targetAmount)
    const term = Number(duration)

    if (!cleanName) return setFormError("Enter a name for this loan.")
    if (!targetAmount.trim() || !Number.isFinite(amount) || amount <= 0) {
      return setFormError("Enter a target amount greater than zero.")
    }
    if (!duration.trim() || !Number.isFinite(term) || term <= 0) {
      return setFormError("Choose a loan term of at least one month.")
    }
    if (loanType === "Yearly" && !Number.isInteger(term)) {
      return setFormError("Enter a whole number of years.")
    }

    setSaving(true)
    setFormError("")
    try {
      await onSave({
        name: cleanName,
        loanTargetAmt: amount,
        duration: term,
        loanType,
        autoDeduction,
        category: category.trim() || "General",
      })
      onOpenChange(false)
    } catch (error) {
      setFormError(error?.message || "Could not save this loan. Check the details and try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !saving && onOpenChange(nextOpen)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{editing ? "Edit loan" : "Add a loan"}</DialogTitle>
          <DialogDescription>
            {editing ? "Update the details while keeping your repayment history." : "Set a clear target and repayment plan."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="loan-name">Loan name</Label>
            <Input id="loan-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Car loan" autoComplete="off" />
          </div>

          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
            <div className="space-y-2">
              <Label htmlFor="loan-target">Target amount{currency ? ` · ${currency}` : ""}</Label>
              <Input id="loan-target" type="number" min="0.01" step="0.01" inputMode="decimal" value={targetAmount} onChange={(event) => setTargetAmount(event.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loan-duration">Term</Label>
              <div className="flex gap-2">
                <Input id="loan-duration" className="min-w-0" type="number" min="1" step="1" inputMode="numeric" value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="1" />
                <Select value={loanType} onValueChange={setLoanType}>
                  <SelectTrigger className="w-[116px] shrink-0" aria-label="Loan term unit">
                    <SelectValue>{loanType}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">Minimum term: one month or one year.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="loan-category">Category</Label>
            <Input id="loan-category" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="General" autoComplete="off" />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Repayment method</legend>
            <RadioGroup
              value={autoDeduction ? "automatic" : "manual"}
              onValueChange={(value) => setAutoDeduction(value === "automatic")}
              className="grid gap-2 sm:grid-cols-2"
            >
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <RadioGroupItem value="manual" aria-label="Manual repayment" className="mt-0.5" />
                <span>
                  <span className="block text-sm font-medium">Manual</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">Record repayments when you make them.</span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <RadioGroupItem value="automatic" aria-label="Automatic repayment" className="mt-0.5" />
                <span>
                  <span className="block text-sm font-medium">Automatic</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">Schedule deductions from available income.</span>
                </span>
              </label>
            </RadioGroup>
          </fieldset>

          {formError && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              <CircleDollarSign className="mr-2 size-4" aria-hidden="true" />
              {saving ? "Saving…" : editing ? "Save changes" : "Create loan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function LoanPaymentDialog({ open, onOpenChange, loan, currency, onPay }) {
  const [amount, setAmount] = useState("")
  const [formError, setFormError] = useState("")
  const [saving, setSaving] = useState(false)
  const remaining = Math.max(0, Number(loan?.loanTargetAmt) - Number(loan?.currentAmt))

  async function handleSubmit(event) {
    event.preventDefault()
    const payment = Number(amount)
    if (!amount.trim() || !Number.isFinite(payment) || payment <= 0) {
      return setFormError("Enter a payment greater than zero.")
    }
    if (payment > remaining) return setFormError("Payment can’t exceed the remaining loan amount.")

    setSaving(true)
    setFormError("")
    try {
      await onPay(payment)
      setAmount("")
      onOpenChange(false)
    } catch (error) {
      setFormError(error?.message || "Could not record this payment. Check the amount and try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !saving && onOpenChange(nextOpen)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Record a repayment</DialogTitle>
          <DialogDescription>{loan?.loanName} · {formatCurrency(remaining, currency)} remaining</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="loan-payment">Payment amount{currency ? ` · ${currency}` : ""}</Label>
            <Input id="loan-payment" type="number" min="0.01" max={remaining} step="0.01" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" autoFocus />
          </div>
          <p className="text-xs text-muted-foreground">One manual repayment per loan is allowed each month.</p>
          {formError && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              <HandCoins className="mr-2 size-4" aria-hidden="true" />{saving ? "Recording…" : "Record payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function DeleteLoanDialog({ open, onOpenChange, loan, currency, onDelete }) {
  const [reason, setReason] = useState("")
  const [formError, setFormError] = useState("")
  const [deleting, setDeleting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!reason) return setFormError("Choose a reason for removing this loan.")

    setDeleting(true)
    setFormError("")
    try {
      await onDelete(reason)
      setReason("")
      onOpenChange(false)
    } catch (error) {
      setFormError(error?.message || "Could not remove this loan. Please try again.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !deleting && onOpenChange(nextOpen)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Remove this loan?</DialogTitle>
          <DialogDescription>
            {loan?.loanName} will be archived and removed from your active loans.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="loan-deletion-reason">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="loan-deletion-reason" className="w-full">
                <SelectValue placeholder="Choose a reason" />
              </SelectTrigger>
              <SelectContent>
                {DELETION_REASONS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">Paid amount returned to your bank balance: {formatCurrency(Number(loan?.currentAmt) || 0, currency)}.</p>
          {formError && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>Keep loan</Button>
            <Button type="submit" variant="destructive" disabled={deleting}>
              <Trash2 className="mr-2 size-4" aria-hidden="true" />{deleting ? "Removing…" : "Confirm removal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
