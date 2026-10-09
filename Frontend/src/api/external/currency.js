// src/api/currencies.js
const RESTCOUNTRIES_URL = "https://restcountries.com/v3.1/all?fields=currencies"

export async function fetchCurrencies() {
  const res = await fetch(RESTCOUNTRIES_URL)

  if (!res.ok) {
    throw new Error("Failed to fetch currency list")
  }

  const data = await res.json()
  const map = new Map()

  data.forEach((country) => {
    const currencies = country.currencies
    if (!currencies) return

    Object.entries(currencies).forEach(([code, info]) => {
      if (!map.has(code)) {
        map.set(code, {
          code,
          name: info.name || code,
          symbol: info.symbol || code,
        })
      }
    })
  })

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
}