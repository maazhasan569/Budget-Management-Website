import apiClient from "@/api/axiosClient"

const BASE_PATH = "/goals"
const pageCache = new Map()
const pageRequests = new Map()
let autoDeductionRequest = null

const fallbackMessages = {
  load: "We couldn’t load your goals. Please try again.",
  create: "Could not create this goal. Check the details and try again.",
  update: "Could not update this goal. Check the details and try again.",
  remove: "Could not remove this goal. Please try again.",
  payment: "Could not record this contribution. Check the amount and try again.",
  auto: "Automatic contributions could not be synchronized. Please try again.",
}

function responseData(response) {
  return response.data?.data
}

export function getFriendlyGoalError(error, action = "load") {
  const message = String(error?.response?.data?.message ?? "").toLowerCase()
  const status = Number(error?.response?.status ?? error?.response?.data?.statusCode)

  if (status === 401 || status === 403) return "Your session may have expired. Sign in and try again."
  if (message.includes("enter all fields")) return "Enter a goal name, target amount, term, and frequency."
  if (message.includes("valid targetamt")) return "Enter a target amount greater than zero."
  if (message.includes("valid amount")) return "Enter a contribution greater than zero."
  if (message.includes("monthly amt already paid")) return "You’ve already contributed to this goal this month."
  if (message.includes("cant be more than targetamt")) return "That contribution is higher than the remaining goal amount."
  if (message.includes("netincome not enough") || message.includes("too large")) return "Your available income is too low for this contribution."
  if (message.includes("overdued")) return "This goal has passed its achievement date. Update the goal to continue contributing."
  if (message.includes("goal not found")) return "This goal is no longer available. Refresh the list and try again."
  if (message.includes("only monthly or yearly")) return "Choose Monthly or Yearly for the goal frequency."
  if (message.includes("invalid")) return "Check the information and try again."

  return fallbackMessages[action] ?? fallbackMessages.load
}

function throwFriendly(error, action) {
  throw new Error(getFriendlyGoalError(error, action), { cause: error })
}

export function invalidateGoalCache() {
  pageCache.clear()
  pageRequests.clear()
}

export function getCachedGoalPage(query = {}) {
  return pageCache.get(JSON.stringify(query)) ?? null
}

async function fetchGoalPage(query) {
  const params = Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== "" && value != null),
  )

  const [goalsResult, paidResult, remainingResult] = await Promise.allSettled([
    apiClient.get(BASE_PATH, { params }),
    apiClient.get(`${BASE_PATH}/amt-paid`),
    apiClient.get(`${BASE_PATH}/amt-remaining`),
  ])

  if (goalsResult.status === "rejected" && goalsResult.reason?.response?.status !== 404) {
    throw goalsResult.reason
  }
  if (paidResult.status === "rejected") throw paidResult.reason
  if (remainingResult.status === "rejected") throw remainingResult.reason

  const pageData = goalsResult.status === "fulfilled" ? responseData(goalsResult.value) : null
  return {
    goals: Array.isArray(pageData?.fetchedDoc) ? pageData.fetchedDoc : [],
    totalDoc: Number(pageData?.totalDoc) || 0,
    totalPages: Number(pageData?.totalPages) || 0,
    page: Number(pageData?.page) || Number(query.page) || 1,
    limit: Number(pageData?.limit) || Number(query.limit) || 8,
    amountPaid: Number(responseData(paidResult.value)) || 0,
    amountRemaining: Number(responseData(remainingResult.value)) || 0,
  }
}

export function getGoalsPage(query, { forceRefresh = false } = {}) {
  const key = JSON.stringify(query)
  if (!forceRefresh && pageCache.has(key)) return Promise.resolve(pageCache.get(key))
  if (!forceRefresh && pageRequests.has(key)) return pageRequests.get(key)

  const request = fetchGoalPage(query)
    .then((data) => {
      pageCache.set(key, data)
      return data
    })
    .finally(() => pageRequests.delete(key))

  pageRequests.set(key, request)
  return request
}

export async function createGoal(values) {
  try {
    const response = await apiClient.post(`${BASE_PATH}/create-goal`, values)
    invalidateGoalCache()
    return responseData(response)
  } catch (error) {
    throwFriendly(error, "create")
  }
}

export async function updateGoal(goalId, values) {
  try {
    const response = await apiClient.put(`${BASE_PATH}/${encodeURIComponent(goalId)}`, values)
    invalidateGoalCache()
    return responseData(response)
  } catch (error) {
    throwFriendly(error, "update")
  }
}

export async function deleteGoal(goalId) {
  try {
    const response = await apiClient.delete(`${BASE_PATH}/${encodeURIComponent(goalId)}`)
    invalidateGoalCache()
    return responseData(response)
  } catch (error) {
    throwFriendly(error, "remove")
  }
}

export async function makeGoalContribution(goalId, amount) {
  try {
    const response = await apiClient.post(
      `${BASE_PATH}/manual-deduct/${encodeURIComponent(goalId)}`,
      { amount },
    )
    invalidateGoalCache()
    return responseData(response)
  } catch (error) {
    throwFriendly(error, "payment")
  }
}

export function syncGoalAutoDeduction() {
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
