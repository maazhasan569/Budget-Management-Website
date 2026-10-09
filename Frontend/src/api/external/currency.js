
const FALLBACK_CURRENCIES = [
  { code: "PKR", name: "Pakistani rupee", symbol: "₨" },
  { code: "USD", name: "United States dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British pound", symbol: "£" },
  { code: "INR", name: "Indian rupee", symbol: "₹" },
  { code: "AED", name: "United Arab Emirates dirham", symbol: "د.إ" },
  { code: "SAR", name: "Saudi riyal", symbol: "﷼" },
  { code: "CAD", name: "Canadian dollar", symbol: "C$" },
  { code: "AUD", name: "Australian dollar", symbol: "A$" },
  { code: "JPY", name: "Japanese yen", symbol: "¥" },
  { code: "CNY", name: "Chinese yuan", symbol: "¥" },
  { code: "CHF", name: "Swiss franc", symbol: "CHF" },
  { code: "SGD", name: "Singapore dollar", symbol: "S$" },
  { code: "NZD", name: "New Zealand dollar", symbol: "NZ$" },
  { code: "BDT", name: "Bangladeshi taka", symbol: "৳" },
  { code: "QAR", name: "Qatari riyal", symbol: "ر.ق" },
  { code: "KWD", name: "Kuwaiti dinar", symbol: "د.ك" },
  { code: "TRY", name: "Turkish lira", symbol: "₺" },
  { code: "ZAR", name: "South African rand", symbol: "R" },
  { code: "BRL", name: "Brazilian real", symbol: "R$" },
]

export async function fetchCurrencies() {
  try {
    const response = await fetch(
      "https://restcountries.com/v3.1/all?fields=name,currencies",
      { signal: AbortSignal.timeout(10000) }
    )

    if (!response.ok) {
      throw new Error(`Currency request failed: ${response.status}`)
    }

    const countries = await response.json()
    const currencyMap = new Map()

    for (const country of countries) {
      for (const [code, currency] of Object.entries(
        country.currencies || {}
      )) {
        if (!currencyMap.has(code)) {
          currencyMap.set(code, {
            code,
            name: currency.name || code,
            symbol: currency.symbol || code,
          })
        }
      }
    }

    const currencies = [...currencyMap.values()].sort((a, b) =>
      a.name.localeCompare(b.name)
    )

    if (currencies.length === 0) {
      throw new Error("No currencies returned")
    }

    return currencies
  } catch (error) {
    console.error("Failed to fetch currencies:", error)

    // Keep onboarding usable even when the API is unavailable.
    return FALLBACK_CURRENCIES
  }
}