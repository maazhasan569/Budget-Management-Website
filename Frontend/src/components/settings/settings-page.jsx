import { useEffect, useMemo, useState } from "react"
import { Check, ChevronsUpDown, Loader2, Save } from "lucide-react"

import { fetchCurrencies } from "@/api/external/currency"
import { loadUserSettings, saveUserSettings } from "@/api/user/settings"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { setSelectedCurrency } from "@/lib/currency"
import { cn } from "@/lib/utils"
import { SettingsSkeleton } from "@/components/settings/settings-skeleton"

const IDENTITY_OPTIONS = [
  { value: "Student", label: "Student" },
  { value: "Working Adults", label: "Working adult" },
  { value: "Retired", label: "Retired" },
]

const EMPTY_SETTINGS = {
  identity: "",
  income: "",
  bankBalance: "",
  budget: "",
  currency: "",
}

const inputClass =
  "h-10 w-full border-slate-700 bg-[#0B1220] text-white placeholder:text-slate-500 focus-visible:ring-emerald-500 sm:max-w-xs"

const rowClass =
  "grid gap-3 border-b border-border/70 py-5 sm:grid-cols-[minmax(0,1fr)_minmax(220px,320px)] sm:items-center"

const controlClass =
  "h-10 w-full border-slate-700 bg-[#0B1220] text-white hover:bg-slate-800 hover:text-white sm:ml-auto sm:max-w-xs"

function settingsFromProfile(profile) {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    throw new Error("Your profile details weren’t returned. Please reload and try again.")
  }

  return {
    identity: profile.identity ?? "",
    income: profile.income == null ? "" : String(profile.income),
    bankBalance: profile.bankBalance == null ? "" : String(profile.bankBalance),
    budget: profile.budget == null ? "" : String(profile.budget),
    currency: profile.currency ?? "",
  }
}

function validateSettings(settings) {
  const errors = {}
  const income = Number(settings.income)
  const bankBalance = Number(settings.bankBalance)
  const budget = Number(settings.budget)

  if (!IDENTITY_OPTIONS.some((option) => option.value === settings.identity)) {
    errors.identity = "Please select one option."
  }
  if (!settings.income.trim()) {
    errors.income = "Income is required."
  } else if (!Number.isFinite(income) || income <= 0) {
    errors.income = "Income must be greater than 0."
  }
  if (!settings.bankBalance.trim()) {
    errors.bankBalance = "Bank balance is required."
  } else if (!Number.isFinite(bankBalance) || bankBalance < 0) {
    errors.bankBalance = "Bank balance cannot be negative."
  }
  if (!settings.budget.trim()) {
    errors.budget = "Budget is required."
  } else if (!Number.isFinite(budget) || budget <= 0) {
    errors.budget = "Budget must be greater than 0."
  } else if (budget >= income) {
    errors.budget = "Budget must be less than your income."
  }
  if (!settings.currency.trim()) {
    errors.currency = "Please select a currency."
  }

  return errors
}

export function SettingsContent() {
  const [settings, setSettings] = useState(EMPTY_SETTINGS)
  const [initialSettings, setInitialSettings] = useState(null)
  const [currencies, setCurrencies] = useState([])
  const [currencyOpen, setCurrencyOpen] = useState(false)
  const [errors, setErrors] = useState({})
  const [loadError, setLoadError] = useState("")
  const [formError, setFormError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadSettings() {
      setLoading(true)
      setLoadError("")

      try {
        const [profile, currencyList] = await Promise.all([
          loadUserSettings(),
          fetchCurrencies(),
        ])
        const loadedSettings = settingsFromProfile(profile)
        const loadedCurrencies = Array.isArray(currencyList) ? currencyList : []

        if (
          loadedSettings.currency &&
          !loadedCurrencies.some((currency) => currency.code === loadedSettings.currency)
        ) {
          loadedCurrencies.push({
            code: loadedSettings.currency,
            name: loadedSettings.currency,
            symbol: loadedSettings.currency,
          })
        }

        if (cancelled) return

        setSettings(loadedSettings)
        setInitialSettings(loadedSettings)
        setCurrencies(loadedCurrencies)
        setSelectedCurrency(loadedSettings.currency)
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error?.response?.data?.message ||
              error?.message ||
              "We couldn’t load your settings. Please try again.",
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadSettings()
    return () => {
      cancelled = true
    }
  }, [])

  const selectedCurrency = useMemo(
    () => currencies.find((currency) => currency.code === settings.currency),
    [currencies, settings.currency],
  )
  const hasChanges =
    initialSettings != null &&
    Object.keys(initialSettings).some((key) => settings[key] !== initialSettings[key])

  function updateSetting(key, value) {
    setSettings((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: "" }))
    setFormError("")
    setSuccessMessage("")
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (saving || !hasChanges) return

    const validationErrors = validateSettings(settings)
    setErrors(validationErrors)
    setFormError("")
    setSuccessMessage("")
    if (Object.keys(validationErrors).length > 0) return

    const payload = {
      identity: settings.identity,
      income: Number(settings.income),
      bankBalance: Number(settings.bankBalance),
      budget: Number(settings.budget),
      currency: settings.currency,
    }

    setSaving(true)
    try {
      await saveUserSettings(payload)
      const savedSettings = {
        ...settings,
        income: String(payload.income),
        bankBalance: String(payload.bankBalance),
        budget: String(payload.budget),
      }
      setSettings(savedSettings)
      setInitialSettings(savedSettings)
      setSelectedCurrency(payload.currency)
      setSuccessMessage("Your settings have been saved.")
    } catch (error) {
      setFormError(
        error?.response?.data?.message ||
          error?.message ||
          "We couldn’t save your settings. Please try again.",
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-1">
      <h1 className="mb-5 text-2xl font-semibold tracking-tight">Settings</h1>

      {loading ? (
        <SettingsSkeleton />
      ) : loadError ? (
        <div className="space-y-4">
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {loadError}
          </p>
          <Button type="button" variant="outline" onClick={() => window.location.reload()}>
            Reload settings
          </Button>
        </div>
      ) : (
        <form noValidate onSubmit={handleSubmit}>
          <div className={rowClass}>
            <div className="space-y-1">
              <Label htmlFor="settings-identity">About you</Label>
              <p className="text-sm text-muted-foreground">Choose the option that best describes you.</p>
            </div>
            <Select
              value={settings.identity}
              onValueChange={(value) => updateSetting("identity", value)}
            >
              <SelectTrigger
                id="settings-identity"
                aria-invalid={Boolean(errors.identity)}
                aria-describedby={errors.identity ? "settings-identity-error" : undefined}
                className={controlClass}
              >
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {IDENTITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.identity && (
              <p id="settings-identity-error" className="text-sm text-red-400 sm:col-start-2" role="alert">
                {errors.identity}
              </p>
            )}
          </div>

          <div className={rowClass}>
            <div className="space-y-1">
              <Label htmlFor="settings-income">Monthly income</Label>
              <p className="text-sm text-muted-foreground">Your regular monthly income.</p>
            </div>
            <Input
              id="settings-income"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={settings.income}
              onChange={(event) => updateSetting("income", event.target.value)}
              aria-invalid={Boolean(errors.income)}
              aria-describedby={errors.income ? "settings-income-error" : undefined}
              className={inputClass}
            />
            {errors.income && (
              <p id="settings-income-error" className="text-sm text-red-400 sm:col-start-2" role="alert">
                {errors.income}
              </p>
            )}
          </div>

          <div className={rowClass}>
            <div className="space-y-1">
              <Label htmlFor="settings-bank-balance">Bank balance</Label>
              <p className="text-sm text-muted-foreground">Your current available balance.</p>
            </div>
            <Input
              id="settings-bank-balance"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={settings.bankBalance}
              onChange={(event) => updateSetting("bankBalance", event.target.value)}
              aria-invalid={Boolean(errors.bankBalance)}
              aria-describedby={errors.bankBalance ? "settings-bank-balance-error" : undefined}
              className={inputClass}
            />
            {errors.bankBalance && (
              <p id="settings-bank-balance-error" className="text-sm text-red-400 sm:col-start-2" role="alert">
                {errors.bankBalance}
              </p>
            )}
          </div>

          <div className={rowClass}>
            <div className="space-y-1">
              <Label htmlFor="settings-budget">Monthly budget</Label>
              <p className="text-sm text-muted-foreground">The amount you plan to spend each month.</p>
            </div>
            <Input
              id="settings-budget"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={settings.budget}
              onChange={(event) => updateSetting("budget", event.target.value)}
              aria-invalid={Boolean(errors.budget)}
              aria-describedby={errors.budget ? "settings-budget-error" : undefined}
              className={inputClass}
            />
            {errors.budget && (
              <p id="settings-budget-error" className="text-sm text-red-400 sm:col-start-2" role="alert">
                {errors.budget}
              </p>
            )}
          </div>

          <div className={cn(rowClass, "border-b-0")}>
            <div className="space-y-1">
              <Label htmlFor="settings-currency">Currency</Label>
              <p className="text-sm text-muted-foreground">Currency used to display your finances.</p>
            </div>
            <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="settings-currency"
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={currencyOpen}
                  aria-invalid={Boolean(errors.currency)}
                  aria-describedby={errors.currency ? "settings-currency-error" : undefined}
                  className={cn(controlClass, "justify-between font-normal")}
                >
                  <span className="truncate">
                    {selectedCurrency
                      ? `${selectedCurrency.name} (${selectedCurrency.code})`
                      : settings.currency || "Search or select currency..."}
                  </span>
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 text-slate-400" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-[--radix-popover-trigger-width] border-slate-800 bg-[#111A2E] p-1 text-slate-100 shadow-xl"
              >
                <Command className="bg-transparent text-slate-100">
                  <CommandInput
                    placeholder="Search currencies..."
                    className="h-10 border-slate-700 text-slate-100 placeholder:text-slate-400"
                  />
                  <CommandList>
                    <CommandEmpty>No currency found.</CommandEmpty>
                    <CommandGroup>
                      {currencies.map((currency) => (
                        <CommandItem
                          key={currency.code}
                          value={`${currency.name} ${currency.code}`}
                          onSelect={() => {
                            updateSetting("currency", currency.code)
                            setCurrencyOpen(false)
                          }}
                          className="text-slate-100 aria-selected:bg-slate-800 aria-selected:text-white"
                        >
                          <Check
                            className={cn(
                              "mr-2 size-4",
                              settings.currency === currency.code ? "opacity-100" : "opacity-0",
                            )}
                            aria-hidden="true"
                          />
                          {currency.name} ({currency.code})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.currency && (
              <p id="settings-currency-error" className="text-sm text-red-400 sm:col-start-2" role="alert">
                {errors.currency}
              </p>
            )}
          </div>

          {formError && (
            <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {formError}
            </p>
          )}
          {successMessage && (
            <p className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300" role="status">
              {successMessage}
            </p>
          )}
          <div className="flex justify-end border-t border-border/70 pt-5">
            <Button type="submit" disabled={!hasChanges || saving}>
              {saving ? (
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="mr-2 size-4" aria-hidden="true" />
              )}
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
