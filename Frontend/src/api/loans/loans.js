import apiClient from "@/api/axiosClient"

const BASE_PATH = "/loans"
const pageCache = new Map()
const pageRequests = new Map()
let autoDeductionRequest = null

const fallbackMessages = {
  load: "We couldn’t load your loans. Please try again.",
  create: "Could not create this loan. Check the details and try again.",
  update: "Could not update this loan. Check the details and try again.",
  remove: "Could not remove this loan. Please try again.",
  payment: "Could not record this payment. Check the amount and try again.",
  auto: "Automatic deductions could not be started. Please try again.",
}

function responseData(response) {
  return response.data?.data
}

function getFriendlyLoanError(error, action = "load") {
  const message = String(error?.response?.data?.message ?? "").toLowerCase()
  const status = Number(error?.response?.status ?? error?.response?.data?.statusCode)

  if (status === 401 || status === 403) {
    return "Your session may have expired. Sign in and try again."
  }
  if (message.includes("enter all fields")) return "Enter a loan name, target amount, term, and repayment frequency."
  if (message.includes("valid amt")) return "Enter a loan target greater than zero."
  if (message.includes("valid duration")) return "Choose a loan term of at least one month."
  if (message.includes("monthly amt already paid")) return "You’ve already made a payment for this loan this month."
  if (message.includes("cant be more than targetamt")) return "That payment is higher than the remaining loan amount."
  if (message.includes("netincome not enough") || message.includes("too large")) return "Your available income is too low for this payment."
  if (message.includes("overdued")) return "This loan term has ended. Update the loan before making another payment."
  if (message.includes("loan not found")) return "This loan is no longer available. Refresh the list and try again."
  if (message.includes("invalid loan deletion reason")) return "Choose a reason before removing this loan."
  if (message.includes("invalid")) return "Check the information and try again."

  return fallbackMessages[action] ?? fallbackMessages.load
}

function throwFriendly(error, action) {
  throw new Error(getFriendlyLoanError(error, action), { cause: error })
}

export function invalidateLoanCache() {
  pageCache.clear()
  pageRequests.clear()
}

export function getCachedLoanPage(query = {}) {
  return pageCache.get(JSON.stringify(query)) ?? null
}

async function fetchLoanPage(query) {
  const params = Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== "" && value != null),
  )

  const [loansResult, paidResult, remainingResult] = await Promise.allSettled([
    apiClient.get(BASE_PATH, { params }),
    apiClient.get(`${BASE_PATH}/amt-paid`),
    apiClient.get(`${BASE_PATH}/amt-remaining`),
  ])

  if (loansResult.status === "rejected" && loansResult.reason?.response?.status !== 404) {
    throw loansResult.reason
  }
  if (paidResult.status === "rejected") throw paidResult.reason
  if (remainingResult.status === "rejected") throw remainingResult.reason

  const pageData = loansResult.status === "fulfilled" ? responseData(loansResult.value) : null
  const result = {
    loans: Array.isArray(pageData?.fetchedDoc) ? pageData.fetchedDoc : [],
    totalDoc: Number(pageData?.totalDoc) || 0,
    totalPages: Number(pageData?.totalPages) || 0,
    page: Number(pageData?.page) || Number(query.page) || 1,
    limit: Number(pageData?.limit) || Number(query.limit) || 8,
    amountPaid: Number(responseData(paidResult.value)) || 0,
    amountRemaining: Number(responseData(remainingResult.value)) || 0,
  }
  return result
}

export function getLoansPage(query, { forceRefresh = false } = {}) {
  const key = JSON.stringify(query)
  if (!forceRefresh && pageCache.has(key)) return Promise.resolve(pageCache.get(key))
  if (!forceRefresh && pageRequests.has(key)) return pageRequests.get(key)

  const request = fetchLoanPage(query)
    .then((data) => {
      pageCache.set(key, data)
      return data
    })
    .finally(() => pageRequests.delete(key))

  pageRequests.set(key, request)
  return request
}

export async function createLoan(values) {
  try {
    const response = await apiClient.post(`${BASE_PATH}/create-loan`, values)
    invalidateLoanCache()
    return responseData(response)
  } catch (error) {
    throwFriendly(error, "create")
  }
}

export async function updateLoan(loanId, values) {
  try {
    const response = await apiClient.put(`${BASE_PATH}/${encodeURIComponent(loanId)}`, values)
    invalidateLoanCache()
    return responseData(response)
  } catch (error) {
    throwFriendly(error, "update")
  }
}

export async function deleteLoan(loanId, deletionReason) {
  try {
    const response = await apiClient.delete(`${BASE_PATH}/${encodeURIComponent(loanId)}`, {
      data: { deletionReason },
    })
    invalidateLoanCache()
    return responseData(response)
  } catch (error) {
    throwFriendly(error, "remove")
  }
}

export async function makeLoanPayment(loanId, amount) {
  try {
    const response = await apiClient.post(
      `${BASE_PATH}/manual-deduct/${encodeURIComponent(loanId)}`,
      { amount },
    )
    invalidateLoanCache()
    return responseData(response)
  } catch (error) {
    throwFriendly(error, "payment")
  }
}

export function startAutoDeduction() {
  if (!autoDeductionRequest) {
    autoDeductionRequest = apiClient
      .post(`${BASE_PATH}/auto-deduct`)
      .then(responseData)
      .catch((error) => {
        throwFriendly(error, "auto")
      })
      .finally(() => {
        autoDeductionRequest = null
      })
  }
  return autoDeductionRequest
}

export { getFriendlyLoanError }
