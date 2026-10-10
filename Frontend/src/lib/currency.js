const SELECTED_CURRENCY_KEY = "finch.selectedCurrency"

export function setSelectedCurrency(currency) {
  if (typeof window === "undefined") return

  const code = typeof currency === "string" ? currency.trim().toUpperCase() : ""
  if (/^[A-Z]{3}$/.test(code)) {
    window.localStorage.setItem(SELECTED_CURRENCY_KEY, code)
  } else {
    window.localStorage.removeItem(SELECTED_CURRENCY_KEY)
  }
}

export function getSelectedCurrency() {
  if (typeof window === "undefined") return null

  const code = window.localStorage.getItem(SELECTED_CURRENCY_KEY)
  return code && /^[A-Z]{3}$/.test(code) ? code : null
}

export function formatCurrency(value, currency = getSelectedCurrency()) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return "—"

  if (!currency) {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(amount)
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(amount)}`
  }
}
