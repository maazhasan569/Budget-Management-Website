import { useEffect, useMemo, useState } from "react"
import { Check, ChevronsUpDown, Loader2, Save, Settings2 } from "lucide-react"

import { fetchCurrencies } from "@/api/external/currency"
import { loadUserSettings, saveUserSettings } from "@/api/user/settings"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { setSelectedCurrency } from "@/lib/currency"
import { cn } from "@/lib/utils"

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
  "h-11 border-slate-700 bg-[#0B1220] text-white placeholder:text-slate-500 focus-visible:ring-emerald-500"

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
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div>
        <div className="flex items-center gap-2 text-primary">
          <Settings2 className="size-5" aria-hidden="true" />
          <p className="text-sm font-medium">Your profile</p>
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Update the financial details you shared when setting up your account.
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Financial profile</CardTitle>
          <CardDescription>
            Changes are applied when you select Save changes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex min-h-40 items-center justify-center gap-2 text-muted-foreground" role="status">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Loading your settings...
            </div>
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
            <form noValidate onSubmit={handleSubmit} className="space-y-6">
              <fieldset className="space-y-3">
                <legend className="text-sm font-medium">Which best describes you?</legend>
                <RadioGroup
                  value={settings.identity}
                  onValueChange={(value) => updateSetting("identity", value)}
                  className="grid gap-3 sm:grid-cols-3"
                  aria-describedby={errors.identity ? "settings-identity-error" : undefined}
                >
                  {IDENTITY_OPTIONS.map((option) => (
                    <Label
                      key={option.value}
                      htmlFor={`settings-identity-${option.value}`}
                      className={cn(
                        "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm transition-colors",
                        settings.identity === option.value
                          ? "border-emerald-500 bg-emerald-500/10 text-white"
                          : "border-slate-700 bg-[#0B1220] text-slate-300 hover:border-slate-600",
                      )}
                    >
                      <RadioGroupItem
                        id={`settings-identity-${option.value}`}
                        value={option.value}
                        className="border-slate-500 text-emerald-500"
                      />
                      {option.label}
                    </Label>
                  ))}
                </RadioGroup>
                {errors.identity && (
                  <p id="settings-identity-error" className="text-sm text-red-400" role="alert">
                    {errors.identity}
                  </p>
                )}
              </fieldset>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="settings-income">Monthly income</Label>
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
                    <p id="settings-income-error" className="text-sm text-red-400" role="alert">
                      {errors.income}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settings-bank-balance">Current bank balance</Label>
                  <Input
                    id="settings-bank-balance"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={settings.bankBalance}
                    onChange={(event) => updateSetting("bankBalance", event.target.value)}
                    aria-invalid={Boolean(errors.bankBalance)}
                    aria-describedby={
                      errors.bankBalance ? "settings-bank-balance-error" : undefined
                    }
                    className={inputClass}
                  />
                  {errors.bankBalance && (
                    <p id="settings-bank-balance-error" className="text-sm text-red-400" role="alert">
                      {errors.bankBalance}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settings-budget">Monthly budget</Label>
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
                    <p id="settings-budget-error" className="text-sm text-red-400" role="alert">
                      {errors.budget}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settings-currency">Preferred currency</Label>
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
                        className="h-11 w-full justify-between border-slate-700 bg-[#0B1220] font-normal text-white hover:bg-slate-800 hover:text-white"
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
                      align="start"
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
                                    settings.currency === currency.code
                                      ? "opacity-100"
                                      : "opacity-0",
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
                    <p id="settings-currency-error" className="text-sm text-red-400" role="alert">
                      {errors.currency}
                    </p>
                  )}
                </div>
              </div>

              {formError && (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                  {formError}
                </p>
              )}
              {successMessage && (
                <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300" role="status">
                  {successMessage}
                </p>
              )}
              <div className="flex justify-end border-t border-border pt-4">
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
        </CardContent>
      </Card>
    </div>
  )
}
