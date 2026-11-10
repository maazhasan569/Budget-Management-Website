
import { useEffect, useState } from "react"
import {
    Check,
    ChevronsUpDown,
    Loader2,
    Wallet,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { fetchCurrencies } from "@/api/external/currency"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { submitAnswers } from "@/api/auth/questions"

const STEPS = ["identity", "income", "bankBalance", "budget", "currency"]

const STEP_TITLES = [
    "About you",
    "Monthly income",
    "Bank balance",
    "Monthly budget",
    "Preferred currency",
]

const IDENTITY_OPTIONS = [
    { value: "Student", label: "Student" },
    { value: "Working Adults", label: "Working adult" },
    { value: "Retired", label: "Retired" },
]

const INCOME_OPTIONS = [500, 1000, 2000, 3500, 5000]
const BANK_BALANCE_OPTIONS = [ 500, 1000, 5000, 10000]

const inputClass =
    "h-11 border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"

export function QuestionsPage() {
    const [stepIndex, setStepIndex] = useState(0)
    const step = STEPS[stepIndex]
    const navigate = useNavigate()
    const [answers, setAnswers] = useState({
        identity: "",
        income: "",
        bankBalance: "",
        budget: "",
        currency: "",
    })

    const [errors, setErrors] = useState({})
    const [submissionError, setSubmissionError] = useState("")
    const [submitting, setSubmitting] = useState(false)

    const [currencies, setCurrencies] = useState([])
    const [currenciesLoading, setCurrenciesLoading] = useState(false)
    const [currenciesError, setCurrenciesError] = useState("")
    const [currencyPopoverOpen, setCurrencyPopoverOpen] = useState(false)

    const progress = Math.round(
        ((stepIndex + 1) / STEPS.length) * 100
    )

    useEffect(() => {
        if (step !== "currency" || currencies.length > 0) return

        let cancelled = false

        async function loadCurrencies() {
            setCurrenciesLoading(true)
            setCurrenciesError("")

            try {
                const list = await fetchCurrencies()

                if (cancelled) return

                if (!Array.isArray(list) || list.length === 0) {
                    throw new Error("No currencies available")
                }

                setCurrencies(list)
            } catch {
                if (!cancelled) {
                    setCurrenciesError(
                        "Couldn't load currencies. Please try again."
                    )
                }
            } finally {
                if (!cancelled) {
                    setCurrenciesLoading(false)
                }
            }
        }

        loadCurrencies()

        return () => {
            cancelled = true
        }
    }, [step, currencies.length])

    function setAnswer(key, value) {
        setSubmissionError("")
        setAnswers((previous) => ({
            ...previous,
            [key]: value,
        }))

        if (errors[key]) {
            setErrors((previous) => ({
                ...previous,
                [key]: "",
            }))
        }
    }

    function validateStep() {
        const newErrors = {}

        if (step === "identity" && !answers.identity) {
            newErrors.identity = "Please select one option."
        }

        if (step === "income") {
            const value = Number(answers.income)

            if (answers.income.trim() === "") {
                newErrors.income = "Income is required."
            } else if (
                !Number.isFinite(value) ||
                value <= 0
            ) {
                newErrors.income = "Income must be greater than 0."
            }
        }

        if (step === "bankBalance") {
            const value = Number(answers.bankBalance)

            if (answers.bankBalance.trim() === "") {
                newErrors.bankBalance = "Bank balance is required."
            } else if (
                !Number.isFinite(value) ||
                value < 0
            ) {
                newErrors.bankBalance =
                    "Bank balance cannot be negative."
            }
        }

        if (step === "budget") {
            const value = Number(answers.budget)
            const income = Number(answers.income)

            if (answers.budget.trim() === "") {
                newErrors.budget = "Budget is required."
            } else if (
                !Number.isFinite(value) ||
                value <= 0
            ) {
                newErrors.budget = "Budget must be greater than 0."
            } else if (value >= income) {
                newErrors.budget =
                    "Budget must be less than your income."
            }
        }

        if (step === "currency" && !answers.currency) {
            newErrors.currency = "Please select a currency."
        }

        setErrors(newErrors)

        return Object.keys(newErrors).length === 0
    }

    async function handleNext() {
        if (submitting) return
        if (!validateStep()) return

        if (stepIndex === STEPS.length - 1) {
            const payload = {
                ...answers,
                income: Number(answers.income),
                bankBalance: Number(answers.bankBalance),
                budget: Number(answers.budget),
            }

            setSubmissionError("")
            setSubmitting(true)
            try {
                await submitAnswers(payload)
                navigate("/dashboard")
            } catch (error) {
                setSubmissionError(
                    error.message || "We couldn’t finish setting up your account. Please try again.",
                )
            } finally {
                setSubmitting(false)
            }
            return 
        }

        setStepIndex((index) =>
            Math.min(index + 1, STEPS.length - 1)
        )
    }

    function handleBack() {
        setErrors({})
        setStepIndex((index) => Math.max(index - 1, 0))
    }

    function handleRetryCurrencies() {
        setCurrencies([])
        setCurrenciesError("")
    }

    const selectedCurrency = currencies.find(
        (currency) => currency.code === answers.currency
    )

    const optionClass = (selected) =>
        cn(
            "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm transition-colors",
            selected
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-accent"
        )

    function AmountOptions({
        options,
        value,
        onSelect,
        name,
    }) {
        return (
            <RadioGroup
                value={value}
                onValueChange={onSelect}
                className="grid grid-cols-2 gap-2 sm:grid-cols-3"
            >
                {options.map((amount) => (
                    <Label
                        key={amount}
                        htmlFor={`${name}-${amount}`}
                        className={optionClass(value === String(amount))}
                    >
                        <RadioGroupItem
                            id={`${name}-${amount}`}
                            value={String(amount)}
                            className="border-primary text-primary"
                        />
                        {amount.toLocaleString()}
                    </Label>
                ))}
            </RadioGroup>
        )
    }

    return (
        <main className="site-page-enter relative flex h-dvh w-full flex-col overflow-hidden bg-background text-foreground">

            {/* Top-attached progress bar */}
            <div
                className="absolute inset-x-0 top-0 z-20 h-1 bg-muted"
                role="progressbar"
                aria-label="Onboarding progress"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                <div
                    className="h-full bg-primary transition-[width] duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Header: logo is deliberately not a link */}
            <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-border px-5 pt-1 sm:px-8 lg:px-12">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Wallet className="h-5 w-5" />
                    </span>
                    <span className="text-xl font-bold tracking-tight text-foreground">
                        Finch
                    </span>
                </div>

                <span className="text-sm text-muted-foreground">
                    {stepIndex + 1} of {STEPS.length}
                </span>
            </header>

            {/* Full-screen question area */}
            <section className="flex min-h-0 flex-1 flex-col px-5 sm:px-8 lg:px-12">
                <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col py-5 sm:py-7">

                    {/* Fixed-height heading area */}
                    <div className="mb-5 shrink-0 sm:mb-7">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                            Personalize your experience
                        </p>

                        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                            {STEP_TITLES[stepIndex]}
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                            {step === "identity" &&
                                "Tell us a little about yourself so we can personalize your financial dashboard."}

                            {step === "income" &&
                                "Choose a suggested amount or enter your monthly income."}

                            {step === "bankBalance" &&
                                "Select a suggested amount or enter your available bank balance."}

                            {step === "budget" &&
                                "Set a monthly spending budget that is lower than your income."}

                            {step === "currency" &&
                                "Choose the currency you want to use throughout Finch."}
                        </p>
                    </div>

                    {/* Stable question panel: does not resize between steps */}
                    <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-border bg-card p-4 sm:p-7 lg:p-9">

                        {/* Consistent question content region */}
                        <div className="min-h-0 flex-1">

                            {/* Step 1: Identity */}
                            {step === "identity" && (
                                <div className="space-y-4">
                                    <Label className="text-base font-medium text-foreground">
                                        Which best describes you?
                                    </Label>

                                    <RadioGroup
                                        value={answers.identity}
                                        onValueChange={(value) =>
                                            setAnswer("identity", value)
                                        }
                                        className="grid gap-3 sm:grid-cols-3"
                                    >
                                        {IDENTITY_OPTIONS.map((option) => (
                                            <Label
                                                key={option.value}
                                                htmlFor={`identity-${option.value}`}
                                                className={optionClass(
                                                    answers.identity === option.value
                                                )}
                                            >
                                                <RadioGroupItem
                                                    id={`identity-${option.value}`}
                                                    value={option.value}
                                                    className="border-primary text-primary"
                                                />
                                                {option.label}
                                            </Label>
                                        ))}
                                    </RadioGroup>

                                    {errors.identity && (
                                        <p className="text-sm text-destructive" role="alert">
                                            {errors.identity}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Step 2: Monthly income */}
                            {step === "income" && (
                                <div className="space-y-4">
                                    <Label className="text-base font-medium text-foreground">
                                        What is your monthly income?
                                    </Label>

                                    <AmountOptions
                                        name="income"
                                        options={INCOME_OPTIONS}
                                        value={answers.income}
                                        onSelect={(value) =>
                                            setAnswer("income", value)
                                        }
                                    />

                                    <div className="space-y-2 pt-2">
                                        <Label
                                            htmlFor="income"
                                            className="text-sm text-muted-foreground"
                                        >
                                            Or enter your exact income
                                        </Label>

                                        <Input
                                            id="income"
                                            type="text"
                                            inputMode="decimal"
                                            autoComplete="off"
                                            placeholder="Enter amount"
                                            value={answers.income}
                                            onChange={(event) =>
                                                setAnswer("income", event.target.value)
                                            }
                                            aria-invalid={Boolean(errors.income)}
                                            aria-describedby={
                                                errors.income ? "income-error" : undefined
                                            }
                                            className={inputClass}
                                        />

                                        {errors.income && (
                                            <p id="income-error" className="text-sm text-destructive" role="alert">
                                                {errors.income}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Bank balance */}
                            {step === "bankBalance" && (
                                <div className="space-y-4">
                                    <Label className="text-base font-medium text-foreground">
                                        What is your current bank balance?
                                    </Label>

                                    <AmountOptions
                                        name="bank"
                                        options={BANK_BALANCE_OPTIONS}
                                        value={answers.bankBalance}
                                        onSelect={(value) =>
                                            setAnswer("bankBalance", value)
                                        }
                                    />

                                    <div className="space-y-2 pt-2">
                                        <Label
                                            htmlFor="bankBalance"
                                            className="text-sm text-muted-foreground"
                                        >
                                            Or enter your exact balance
                                        </Label>

                                        <Input
                                            id="bankBalance"
                                            type="text"
                                            inputMode="decimal"
                                            autoComplete="off"
                                            placeholder="Enter amount"
                                            value={answers.bankBalance}
                                            onChange={(event) =>
                                                setAnswer("bankBalance", event.target.value)
                                            }
                                            aria-invalid={Boolean(errors.bankBalance)}
                                            aria-describedby={
                                                errors.bankBalance
                                                    ? "bank-balance-error"
                                                    : undefined
                                            }
                                            className={inputClass}
                                        />

                                        {errors.bankBalance && (
                                            <p id="bank-balance-error" className="text-sm text-destructive" role="alert">
                                                {errors.bankBalance}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Monthly budget */}
                            {step === "budget" && (
                                <div className="max-w-xl space-y-3">
                                    <Label
                                        htmlFor="budget"
                                        className="text-base font-medium text-foreground"
                                    >
                                        What is your monthly budget?
                                    </Label>

                                    <p className="text-sm text-muted-foreground">
                                        Enter the total amount you plan to spend each month.
                                    </p>

                                    <Input
                                        id="budget"
                                        type="text"
                                        inputMode="decimal"
                                        autoComplete="off"
                                        placeholder="Enter monthly budget"
                                        value={answers.budget}
                                        onChange={(event) =>
                                            setAnswer("budget", event.target.value)
                                        }
                                        aria-invalid={Boolean(errors.budget)}
                                        aria-describedby={
                                            errors.budget ? "budget-error" : undefined
                                        }
                                        className={inputClass}
                                    />

                                    {errors.budget && (
                                        <p id="budget-error" className="text-sm text-destructive" role="alert">
                                            {errors.budget}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Step 5: Searchable currency combobox */}
                            {step === "currency" && (
                                <div className="max-w-xl space-y-3">
                                    <Label className="text-base font-medium text-foreground">
                                        Which currency do you use?
                                    </Label>

                                    <p className="text-sm text-muted-foreground">
                                        Search by currency name or code.
                                    </p>

                                    <Popover
                                        open={currencyPopoverOpen}
                                        onOpenChange={setCurrencyPopoverOpen}
                                    >
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={currencyPopoverOpen}
                                                disabled={currenciesLoading}
                                                aria-label={currenciesLoading ? "Loading currencies" : undefined}
                                                aria-busy={currenciesLoading}
                                                className="h-12 w-full justify-between font-normal"
                                            >
                                                <span className="flex min-w-0 items-center gap-2 truncate">
                                                    {currenciesLoading ? (
                                                        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
                                                    ) : selectedCurrency ? (
                                                        `${selectedCurrency.name} (${selectedCurrency.code})`
                                                    ) : answers.currency ? (
                                                        answers.currency
                                                    ) : (
                                                        "Search or select currency..."
                                                    )}
                                                </span>

                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
                                            </Button>
                                        </PopoverTrigger>

                                        <PopoverContent
                                            align="start"
                                            className="w-[--radix-popover-trigger-width] border-border bg-popover p-1 text-popover-foreground shadow-xl"
                                        >
                                            <Command className="currency-command bg-transparent text-popover-foreground">
                                                <CommandInput
                                                    placeholder="Search currency..."
                                                    className="border-border text-foreground placeholder:text-muted-foreground"
                                                />

                                                <CommandList className="currency-command-list max-h-60">
                                                    <CommandEmpty>
                                                        No currency found.
                                                    </CommandEmpty>

                                                    <CommandGroup>
                                                        {currencies.map((currency) => (
                                                            <CommandItem
                                                                key={currency.code}
                                                                value={`${currency.code} ${currency.name} ${currency.symbol}`}
                                                                onSelect={() => {
                                                                    setAnswer("currency", currency.code)
                                                                    setCurrencyPopoverOpen(false)
                                                                }}
                                                                className="currency-command-item cursor-pointer px-3 py-2"
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4 shrink-0 text-primary",
                                                                        answers.currency === currency.code
                                                                            ? "opacity-100"
                                                                            : "opacity-0"
                                                                    )}
                                                                />

                                                                <span className="flex-1 truncate">
                                                                    {currency.name}
                                                                </span>

                                                                <span className="ml-3 shrink-0 text-xs text-muted-foreground">
                                                                    {currency.code} · {currency.symbol}
                                                                </span>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>

                                    {currenciesError && (
                                        <div className="space-y-2">
                                            <p className="text-sm text-destructive" role="alert">
                                                {currenciesError}
                                            </p>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={handleRetryCurrencies}
                                            >
                                                Try again
                                            </Button>
                                        </div>
                                    )}

                                    {errors.currency && (
                                        <p className="text-sm text-destructive" role="alert">
                                            {errors.currency}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Navigation stays at the bottom of the same panel */}
                        {submissionError && (
                            <p className="mb-3 text-sm text-destructive" role="alert">
                                {submissionError}
                            </p>
                        )}
                        <div className="mt-5 flex shrink-0 gap-3 border-t border-border pt-4 sm:mt-7 sm:pt-5">
                            {stepIndex > 0 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleBack}
                                    className="h-11 min-w-24"
                                >
                                    Back
                                </Button>
                            )}

                            <Button
                                type="button"
                                onClick={handleNext}
                                disabled={submitting}
                                className="h-11 flex-1 font-semibold"
                                aria-label={submitting ? "Finishing setup" : undefined}
                                aria-busy={submitting}
                            >
                                {submitting
                                    ? <Loader2 className="mx-auto size-4 animate-spin" aria-hidden="true" />
                                    : stepIndex === STEPS.length - 1
                                    ? "Finish setup"
                                    : "Continue"}
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="flex h-10 shrink-0 items-center justify-center border-t border-border px-4 text-center text-xs text-muted-foreground">
                Your financial information helps personalize your experience.
            </footer>
        </main>
    )
}
