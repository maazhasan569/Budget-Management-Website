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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency } from "@/lib/currency"

function durationForForm(goal) {
  const duration = Number(goal?.duration)
  if (!Number.isFinite(duration)) return ""
  return String(goal?.type === "Yearly" ? duration / 12 : duration)
}

export function GoalFormDialog({ open, onOpenChange, goal, currency, onSave }) {
  const editing = Boolean(goal)
  const [name, setName] = useState(goal?.goalName ?? "")
  const [targetAmount, setTargetAmount] = useState(
    goal?.targetAmount == null ? "" : String(goal.targetAmount),
  )
  const [duration, setDuration] = useState(durationForForm(goal))
  const [type, setType] = useState(goal?.type ?? "Monthly")
  const [category, setCategory] = useState(goal?.category === "General" ? "" : goal?.category ?? "")
  const [autoDeduction, setAutoDeduction] = useState(Boolean(goal?.autoDeduction))
  const [formError, setFormError] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const cleanName = name.trim()
    const amount = Number(targetAmount)
    const term = Number(duration)

    if (!cleanName) return setFormError("Enter a name for this goal.")
    if (!targetAmount.trim() || !Number.isFinite(amount) || amount <= 0) {
      return setFormError("Enter a target amount greater than zero.")
    }
    if (!duration.trim() || !Number.isFinite(term) || term <= 0) {
      return setFormError("Choose a goal term greater than zero.")
    }
    if (type === "Yearly" && !Number.isInteger(term)) {
      return setFormError("Enter a whole number of years.")
    }

    setSaving(true)
    setFormError("")
    try {
      await onSave({
        name: cleanName,
        targetAmount: amount,
        type,
        duration: term,
        category: category.trim() || "General",
        autoDeduction,
      })
      onOpenChange(false)
    } catch (error) {
      setFormError(error?.message || "Could not save this goal. Check the details and try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !saving && onOpenChange(nextOpen)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{editing ? "Edit goal" : "Create a goal"}</DialogTitle>
          <DialogDescription>
            {editing ? "Adjust the target or timeline for this goal." : "Choose something meaningful and give it a clear target."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goal-name">Goal name</Label>
            <Input id="goal-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Emergency fund" autoComplete="off" />
          </div>

          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
            <div className="space-y-2">
              <Label htmlFor="goal-target">Target amount{currency ? ` · ${currency}` : ""}</Label>
              <Input id="goal-target" type="number" min="0.01" step="0.01" inputMode="decimal" value={targetAmount} onChange={(event) => setTargetAmount(event.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-duration">Timeline</Label>
              <div className="flex gap-2">
                <Input id="goal-duration" className="min-w-0" type="number" min="1" step="1" inputMode="numeric" value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="1" />
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="w-[116px] shrink-0" aria-label="Goal timeline unit">
                    <SelectValue>{type}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">Set a timeline of at least one month or one year.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-category">Category</Label>
            <Input id="goal-category" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="General" autoComplete="off" />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Contribution method</legend>
            <RadioGroup
              value={autoDeduction ? "automatic" : "manual"}
              onValueChange={(value) => setAutoDeduction(value === "automatic")}
              className="grid gap-2 sm:grid-cols-2"
            >
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <RadioGroupItem value="manual" aria-label="Manual contributions" className="mt-0.5" />
                <span>
                  <span className="block text-sm font-medium">Manual</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">Record contributions when you make them.</span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <RadioGroupItem value="automatic" aria-label="Automatic contributions" className="mt-0.5" />
                <span>
                  <span className="block text-sm font-medium">Automatic</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">Set recurring contributions from available income.</span>
                </span>
              </label>
            </RadioGroup>
          </fieldset>

          {formError && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              <CircleDollarSign className="mr-2 size-4" aria-hidden="true" />
              {saving ? "Saving…" : editing ? "Save changes" : "Create goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function GoalContributionDialog({ open, onOpenChange, goal, currency, onContribute }) {
  const [amount, setAmount] = useState("")
  const [formError, setFormError] = useState("")
  const [saving, setSaving] = useState(false)
  const remaining = Math.max(0, Number(goal?.targetAmount) - Number(goal?.currentAmt))

  async function handleSubmit(event) {
    event.preventDefault()
    const contribution = Number(amount)
    if (!amount.trim() || !Number.isFinite(contribution) || contribution <= 0) {
      return setFormError("Enter a contribution greater than zero.")
    }
    if (contribution > remaining) {
      return setFormError("Your contribution can’t exceed the remaining goal amount.")
    }

    setSaving(true)
    setFormError("")
    try {
      await onContribute(contribution)
      setAmount("")
      onOpenChange(false)
    } catch (error) {
      setFormError(error?.message || "Could not record this contribution. Check the amount and try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !saving && onOpenChange(nextOpen)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Add a contribution</DialogTitle>
          <DialogDescription>{goal?.goalName} · {formatCurrency(remaining, currency)} remaining</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goal-contribution">Contribution amount{currency ? ` · ${currency}` : ""}</Label>
            <Input id="goal-contribution" type="number" min="0.01" max={remaining} step="0.01" inputMode="decimal" value={amount} onChange={(event) => { setAmount(event.target.value); setFormError("") }} placeholder="0.00" autoFocus />
          </div>
          <p className="text-xs text-muted-foreground">One manual contribution per goal is allowed each month.</p>
          {formError && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              <HandCoins className="mr-2 size-4" aria-hidden="true" />{saving ? "Recording…" : "Record contribution"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function DeleteGoalDialog({ open, onOpenChange, goal, currency, onDelete }) {
  const [formError, setFormError] = useState("")
  const [deleting, setDeleting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setDeleting(true)
    setFormError("")
    try {
      await onDelete()
      onOpenChange(false)
    } catch (error) {
      setFormError(error?.message || "Could not remove this goal. Please try again.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !deleting && onOpenChange(nextOpen)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Remove this goal?</DialogTitle>
          <DialogDescription>
            {goal?.goalName} will be archived and removed from your active goals.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your current contribution of {formatCurrency(Number(goal?.currentAmt) || 0, currency)} will be returned to available income.
          </p>
          {formError && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>Keep goal</Button>
            <Button type="submit" variant="destructive" disabled={deleting}>
              <Trash2 className="mr-2 size-4" aria-hidden="true" />{deleting ? "Removing…" : "Confirm removal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
