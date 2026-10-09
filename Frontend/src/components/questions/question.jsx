
import { useEffect, useState } from "react"
import {
    Check,
    ChevronsUpDown,
    Loader2,
    Wallet,
} from "lucide-react"

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
    "h-11 border-slate-700 bg-[#0B1220] text-white placeholder:text-slate-500 focus-visible:ring-emerald-500"

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

    const [errors, setErrors] = useState({})

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

    function handleNext() {
        if (!validateStep()) return

        if (stepIndex === STEPS.length - 1) {
            // Convert numeric strings before sending the answers
            // to your onboarding API.
            const payload = {
                ...answers,
                income: Number(answers.income),
                bankBalance: Number(answers.bankBalance),
                budget: Number(answers.budget),
            }

            console.log("Submitting onboarding answers:", payload)

            // Connect your onboarding submission API here.
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
                ? "border-emerald-500 bg-emerald-500/10 text-white"
                : "border-slate-700 bg-[#0B1220] text-slate-300 hover:border-slate-600 hover:bg-slate-800/60"
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
                            className="border-slate-500 text-emerald-500"
                        />
                        {amount.toLocaleString()}
                    </Label>
                ))}
            </RadioGroup>
        )
    }

    return (
        <main className="relative flex h-dvh w-full flex-col overflow-hidden bg-[#0B1220] text-slate-100">

            {/* Top-attached progress bar */}
            <div
                className="absolute inset-x-0 top-0 z-20 h-1 bg-slate-800"
                role="progressbar"
                aria-label="Onboarding progress"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                <div
                    className="h-full bg-emerald-500 transition-[width] duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Header: logo is deliberately not a link */}
            <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-slate-800 px-5 pt-1 sm:px-8 lg:px-12">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                        <Wallet className="h-5 w-5" />
                    </span>
                    <span className="text-xl font-bold tracking-tight text-white">
                        Finch
                    </span>
                </div>

                <span className="text-sm text-slate-400">
                    {stepIndex + 1} of {STEPS.length}
                </span>
            </header>

            {/* Full-screen question area */}
            <section className="flex min-h-0 flex-1 flex-col px-5 sm:px-8 lg:px-12">
                <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col py-5 sm:py-7">

                    {/* Fixed-height heading area */}
                    <div className="mb-5 shrink-0 sm:mb-7">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
                            Personalize your experience
                        </p>

                        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                            {STEP_TITLES[stepIndex]}
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
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
                    <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-800 bg-[#111A2E] p-4 sm:p-7 lg:p-9">

                        {/* Consistent question content region */}
                        <div className="min-h-0 flex-1">

                            {/* Step 1: Identity */}
                            {step === "identity" && (
                                <div className="space-y-4">
                                    <Label className="text-base font-medium text-slate-200">
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
                                                    className="border-slate-500 text-emerald-500"
                                                />
                                                {option.label}
                                            </Label>
                                        ))}
                                    </RadioGroup>

                                    {errors.identity && (
                                        <p className="text-sm text-red-400" role="alert">
                                            {errors.identity}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Step 2: Monthly income */}
                            {step === "income" && (
                                <div className="space-y-4">
                                    <Label className="text-base font-medium text-slate-200">
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
                                            className="text-sm text-slate-300"
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
                                            <p id="income-error" className="text-sm text-red-400" role="alert">
                                                {errors.income}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Bank balance */}
                            {step === "bankBalance" && (
                                <div className="space-y-4">
                                    <Label className="text-base font-medium text-slate-200">
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
                                            className="text-sm text-slate-300"
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
                                            <p id="bank-balance-error" className="text-sm text-red-400" role="alert">
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
                                        className="text-base font-medium text-slate-200"
                                    >
                                        What is your monthly budget?
                                    </Label>

                                    <p className="text-sm text-slate-400">
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
                                        <p id="budget-error" className="text-sm text-red-400" role="alert">
                                            {errors.budget}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Step 5: Searchable currency combobox */}
                            {step === "currency" && (
                                <div className="max-w-xl space-y-3">
                                    <Label className="text-base font-medium text-slate-200">
                                        Which currency do you use?
                                    </Label>

                                    <p className="text-sm text-slate-400">
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
                                                className="h-12 w-full justify-between border-slate-700 bg-[#0B1220] font-normal text-slate-100 hover:bg-slate-800 hover:text-white"
                                            >
                                                <span className="flex min-w-0 items-center gap-2 truncate">
                                                    {currenciesLoading ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                                                            Loading currencies...
                                                        </>
                                                    ) : selectedCurrency ? (
                                                        `${selectedCurrency.name} (${selectedCurrency.code})`
                                                    ) : answers.currency ? (
                                                        answers.currency
                                                    ) : (
                                                        "Search or select currency..."
                                                    )}
                                                </span>

                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
                                            </Button>
                                        </PopoverTrigger>

                                        <PopoverContent
                                            align="start"
                                            className="w-[--radix-popover-trigger-width] border-slate-800 bg-[#111A2E] p-1 text-slate-100 shadow-xl"
                                        >
                                            <Command className="bg-transparent text-slate-100">
                                                <CommandInput
                                                    placeholder="Search currency..."
                                                    className="border-slate-700"
                                                />

                                                <CommandList className="max-h-60">
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
                                                                className="cursor-pointer rounded-md border-0 bg-transparent px-3 py-2 text-slate-200 shadow-none hover:bg-slate-800 aria-selected:bg-slate-800 aria-selected:text-white"
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4 shrink-0 text-emerald-400",
                                                                        answers.currency === currency.code
                                                                            ? "opacity-100"
                                                                            : "opacity-0"
                                                                    )}
                                                                />

                                                                <span className="flex-1 truncate">
                                                                    {currency.name}
                                                                </span>

                                                                <span className="ml-3 shrink-0 text-xs text-slate-400">
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
                                            <p className="text-sm text-red-400" role="alert">
                                                {currenciesError}
                                            </p>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={handleRetryCurrencies}
                                                className="border-slate-700 hover:bg-slate-800"
                                            >
                                                Try again
                                            </Button>
                                        </div>
                                    )}

                                    {errors.currency && (
                                        <p className="text-sm text-red-400" role="alert">
                                            {errors.currency}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Navigation stays at the bottom of the same panel */}
                        <div className="mt-5 flex shrink-0 gap-3 border-t border-slate-800 pt-4 sm:mt-7 sm:pt-5">
                            {stepIndex > 0 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleBack}
                                    className="h-11 min-w-24 border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800 hover:text-white"
                                >
                                    Back
                                </Button>
                            )}

                            <Button
                                type="button"
                                onClick={handleNext}
                                className="h-11 flex-1 bg-emerald-500 font-semibold text-slate-950 hover:bg-emerald-400"
                            >
                                {stepIndex === STEPS.length - 1
                                    ? "Finish setup"
                                    : "Continue"}
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="flex h-10 shrink-0 items-center justify-center border-t border-slate-800 px-4 text-center text-xs text-slate-500">
                Your financial information helps personalize your experience.
            </footer>
        </main>
    )
}

