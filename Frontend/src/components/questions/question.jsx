// src/pages/onboarding/questions-page.jsx
import { useEffect, useState } from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"

import { fetchCurrencies } from "@/api/currencies"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"

const STEPS = ["identity", "income", "bankBalance", "budget", "currency"]

const IDENTITY_OPTIONS = [
  { value: "Student", label: "Student" },
  { value: "Working Adults", label: "Working adult" },
  { value: "Retires", label: "Retired" },
]

const INCOME_OPTIONS = [500, 1000, 2000, 3500, 5000]
const BANK_BALANCE_OPTIONS = [0, 500, 1000, 5000, 10000]

export function QuestionsPage() {
  const [stepIndex, setStepIndex] = useState(0)
  const step = STEPS[stepIndex]

  const [answers, setAnswers] = useState({
    identity: "",
    income: "",
    bankBalance: "",
    budget: "",
    currency: "",
  })

  const [incomeMode, setIncomeMode] = useState("preset") // "preset" | "other"
  const [bankMode, setBankMode] = useState("preset")

  const [errors, setErrors] = useState({})

  const [currencies, setCurrencies] = useState([])
  const [currenciesLoading, setCurrenciesLoading] = useState(false)
  const [currenciesError, setCurrenciesError] = useState("")
  const [currencyPopoverOpen, setCurrencyPopoverOpen] = useState(false)

  useEffect(() => {
    if (step !== "currency" || currencies.length > 0) return

    setCurrenciesLoading(true)
    setCurrenciesError("")

    fetchCurrencies()
      .then((list) => setCurrencies(list))
      .catch(() => setCurrenciesError("Couldn't load currencies. Try again."))
      .finally(() => setCurrenciesLoading(false))
  }, [step, currencies.length])

  const progress = Math.round(((stepIndex + 1) / STEPS.length) * 100)

  function setAnswer(key, value) {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }))
    }
  }

  function validateStep() {
    const newErrors = {}

    if (step === "identity") {
      if (!answers.identity) {
        newErrors.identity = "Please select one option."
      }
    }

    if (step === "income") {
      const value = Number(answers.income)
      if (!answers.income) {
        newErrors.income = "Income is required."
      } else if (Number.isNaN(value) || value <= 0) {
        newErrors.income = "Income must be greater than 0."
      }
    }

    if (step === "bankBalance") {
      const value = Number(answers.bankBalance)
      if (answers.bankBalance === "") {
        newErrors.bankBalance = "Bank balance is required."
      } else if (Number.isNaN(value) || value < 0) {
        newErrors.bankBalance = "Bank balance cannot be negative."
      }
    }

    if (step === "budget") {
      const value = Number(answers.budget)
      const income = Number(answers.income)

      if (!answers.budget) {
        newErrors.budget = "Budget is required."
      } else if (Number.isNaN(value) || value <= 0) {
        newErrors.budget = "Budget must be greater than 0."
      } else if (value >= income) {
        newErrors.budget = "Budget must be less than your income."
      }
    }

    if (step === "currency") {
      if (!answers.currency) {
        newErrors.currency = "Please select a currency."
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleNext() {
    if (!validateStep()) return

    if (stepIndex === STEPS.length - 1) {
      // All questions answered — call your onboarding API here.
      console.log("Submitting onboarding answers:", answers)
      return
    }

    setStepIndex((i) => i + 1)
  }

  function handleBack() {
    setStepIndex((i) => Math.max(0, i - 1))
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <Progress value={progress} className="h-2" />
          <div>
            <CardTitle className="text-xl">Let's set up your account</CardTitle>
            <CardDescription>
              Step {stepIndex + 1} of {STEPS.length}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === "identity" && (
            <div className="space-y-3">
              <Label>Which best describes you?</Label>
              <RadioGroup
                value={answers.identity}
                onValueChange={(value) => setAnswer("identity", value)}
              >
                {IDENTITY_OPTIONS.map((option) => (
                  <Label
                    key={option.value}
                    htmlFor={`identity-${option.value}`}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm font-normal",
                      answers.identity === option.value
                        ? "border-primary bg-primary/5"
                        : "border-input"
                    )}
                  >
                    <RadioGroupItem
                      id={`identity-${option.value}`}
                      value={option.value}
                    />
                    {option.label}
                  </Label>
                ))}
              </RadioGroup>
              {errors.identity && (
                <p className="text-sm text-destructive">{errors.identity}</p>
              )}
            </div>
          )}

          {step === "income" && (
            <div className="space-y-3">
              <Label>What's your monthly income?</Label>

              <RadioGroup
                value={incomeMode === "preset" ? answers.income : ""}
                onValueChange={(value) => {
                  setIncomeMode("preset")
                  setAnswer("income", value)
                }}
              >
                {INCOME_OPTIONS.map((amount) => (
                  <Label
                    key={amount}
                    htmlFor={`income-${amount}`}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm font-normal",
                      incomeMode === "preset" && answers.income === String(amount)
                        ? "border-primary bg-primary/5"
                        : "border-input"
                    )}
                  >
                    <RadioGroupItem id={`income-${amount}`} value={String(amount)} />
                    ${amount.toLocaleString()}
                  </Label>
                ))}
              </RadioGroup>

              <button
                type="button"
                onClick={() => {
                  setIncomeMode("other")
                  setAnswer("income", "")
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm",
                  incomeMode === "other"
                    ? "border-primary bg-primary/5"
                    : "border-input text-muted-foreground"
                )}
              >
                Other amount
              </button>

              {incomeMode === "other" && (
                <Input
                  type="number"
                  min="0"
                  placeholder="Enter your monthly income"
                  value={answers.income}
                  onChange={(e) => setAnswer("income", e.target.value)}
                />
              )}

              {errors.income && (
                <p className="text-sm text-destructive">{errors.income}</p>
              )}
            </div>
          )}

          {step === "bankBalance" && (
            <div className="space-y-3">
              <Label>What's your current bank balance?</Label>

              <RadioGroup
                value={bankMode === "preset" ? answers.bankBalance : ""}
                onValueChange={(value) => {
                  setBankMode("preset")
                  setAnswer("bankBalance", value)
                }}
              >
                {BANK_BALANCE_OPTIONS.map((amount) => (
                  <Label
                    key={amount}
                    htmlFor={`bank-${amount}`}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm font-normal",
                      bankMode === "preset" && answers.bankBalance === String(amount)
                        ? "border-primary bg-primary/5"
                        : "border-input"
                    )}
                  >
                    <RadioGroupItem id={`bank-${amount}`} value={String(amount)} />
                    ${amount.toLocaleString()}
                  </Label>
                ))}
              </RadioGroup>

              <button
                type="button"
                onClick={() => {
                  setBankMode("other")
                  setAnswer("bankBalance", "")
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm",
                  bankMode === "other"
                    ? "border-primary bg-primary/5"
                    : "border-input text-muted-foreground"
                )}
              >
                Other amount
              </button>

              {bankMode === "other" && (
                <Input
                  type="number"
                  min="0"
                  placeholder="Enter your bank balance"
                  value={answers.bankBalance}
                  onChange={(e) => setAnswer("bankBalance", e.target.value)}
                />
              )}

              {errors.bankBalance && (
                <p className="text-sm text-destructive">{errors.bankBalance}</p>
              )}
            </div>
          )}

          {step === "budget" && (
            <div className="space-y-3">
              <Label htmlFor="budget">What's your monthly budget?</Label>
              <Input
                id="budget"
                type="number"
                min="0"
                placeholder="Must be less than your income"
                value={answers.budget}
                onChange={(e) => setAnswer("budget", e.target.value)}
              />
              {errors.budget && (
                <p className="text-sm text-destructive">{errors.budget}</p>
              )}
            </div>
          )}

          {step === "currency" && (
            <div className="space-y-3">
              <Label>Which currency do you use?</Label>

              <Popover open={currencyPopoverOpen} onOpenChange={setCurrencyPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={currencyPopoverOpen}
                    className="w-full justify-between font-normal"
                    disabled={currenciesLoading}
                  >
                    {currenciesLoading && (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading currencies...
                      </span>
                    )}
                    {!currenciesLoading && answers.currency
                      ? currencies.find((c) => c.code === answers.currency)?.name
                      : !currenciesLoading && "Select currency"}
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Search currency..." />
                    <CommandList>
                      <CommandEmpty>No currency found.</CommandEmpty>
                      <CommandGroup>
                        {currencies.map((c) => (
                          <CommandItem
                            key={c.code}
                            value={`${c.code} ${c.name}`}
                            onSelect={() => {
                              setAnswer("currency", c.code)
                              setCurrencyPopoverOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                answers.currency === c.code
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {c.name} ({c.symbol})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {currenciesError && (
                <p className="text-sm text-destructive">{currenciesError}</p>
              )}
              {errors.currency && (
                <p className="text-sm text-destructive">{errors.currency}</p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {stepIndex > 0 && (
              <Button variant="outline" className="flex-1" onClick={handleBack}>
                Back
              </Button>
            )}
            <Button className="flex-1" onClick={handleNext}>
              {stepIndex === STEPS.length - 1 ? "Finish" : "Next"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}