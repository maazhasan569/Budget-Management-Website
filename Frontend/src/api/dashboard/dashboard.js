import apiClient from "@/api/axiosClient"

let dashboardCache = null
let dashboardRequest = null
let dashboardCacheVersion = 0

const endpointPaths = {
  budget: "/expenses/budget",
  goals: "/dashboard/goal-progress",
  loans: "/dashboard/loan-progress",
  alerts: "/dashboard/goal-loan-alerts",
  flagged: "/dashboard/flagged-docs",
  trends: "/dashboard/spending-trends",
  categories: "/dashboard/expense-categories",
  score: "/dashboard/financial-score",
}

async function requestData(path) {
  const response = await apiClient.get(path)
  return response.data?.data
}

function resultValue(result, fallback) {
  return result.status === "fulfilled" ? result.value : fallback
}

function hasRequestError(result) {
  return result.status === "rejected"
}

async function fetchDashboardData() {
  const initialResults = await Promise.allSettled([
    requestData(endpointPaths.budget),
    requestData(endpointPaths.goals),
    requestData(endpointPaths.loans),
    requestData(endpointPaths.trends),
  ])

  const [budgetResult, goalsResult, loansResult, trendsResult] = initialResults

  const budgetUnavailable =
    budgetResult.status === "rejected" && budgetResult.reason?.response?.status === 404
  const budget = budgetUnavailable ? null : resultValue(budgetResult, null)
  const goals = resultValue(goalsResult, [])
  const loans = resultValue(loansResult, [])
  const spending = resultValue(trendsResult, { granularity: "day", data: [] })
  const expenseData = Array.isArray(spending?.data) ? spending.data : []
  const hasGoalOrLoanData =
    (Array.isArray(goals) && goals.length > 0) ||
    (Array.isArray(loans) && loans.length > 0)
  const hasScoreInputs =
    Number.isFinite(budget) ||
    hasGoalOrLoanData ||
    expenseData.length > 0

  let alerts = []
  let flagged = { flaggedGoals: [], flaggedLoans: [] }
  let alertsError = false
  let flaggedError = false
  if (hasGoalOrLoanData) {
    const [alertsResult, flaggedResult] = await Promise.allSettled([
      requestData(endpointPaths.alerts),
      requestData(endpointPaths.flagged),
    ])
    alerts = resultValue(alertsResult, [])
    flagged = resultValue(flaggedResult, flagged)
    alertsError = hasRequestError(alertsResult)
    flaggedError = hasRequestError(flaggedResult)
  }

  let categoryPercentages = {}
  let score = 100
  const errors = {
    budget: hasRequestError(budgetResult) && !budgetUnavailable,
    goals: hasRequestError(goalsResult),
    loans: hasRequestError(loansResult),
    alerts: alertsError,
    flagged: flaggedError,
    trends: hasRequestError(trendsResult),
    categories: false,
    score: false,
  }

  if (expenseData.length > 0) {
    try {
      categoryPercentages = (await requestData(endpointPaths.categories)) ?? {}
    } catch (error) {
      // The backend uses 400 to indicate that no expenses exist for this user.
      if (error.response?.status !== 400) errors.categories = true
    }
  }

  if (hasScoreInputs) {
    try {
      const fetchedScore = await requestData(endpointPaths.score)
      const numericScore = Number(fetchedScore)
      if (Number.isFinite(numericScore)) score = numericScore
      else errors.score = true
    } catch {
      errors.score = true
    }
  }

  return {
    budget: Number.isFinite(budget) ? budget : null,
    goals: Array.isArray(goals) ? goals : [],
    loans: Array.isArray(loans) ? loans : [],
    alerts: Array.isArray(alerts) ? alerts : [],
    flagged: {
      flaggedGoals: Array.isArray(flagged?.flaggedGoals) ? flagged.flaggedGoals : [],
      flaggedLoans: Array.isArray(flagged?.flaggedLoans) ? flagged.flaggedLoans : [],
    },
    spending: {
      granularity: spending?.granularity ?? "day",
      data: expenseData,
    },
    categoryPercentages:
      categoryPercentages && typeof categoryPercentages === "object"
        ? categoryPercentages
        : {},
    score,
    hasScoreInputs,
    errors,
  }
}

export function getCachedDashboardData() {
  return dashboardCache
}

export function invalidateDashboardCache() {
  dashboardCacheVersion += 1
  dashboardCache = null
  dashboardRequest = null
}

export function getDashboardData({ forceRefresh = false } = {}) {
  if (dashboardCache && !forceRefresh) return Promise.resolve(dashboardCache)
  if (dashboardRequest && !forceRefresh) return dashboardRequest

  if (forceRefresh) {
    dashboardCacheVersion += 1
    dashboardRequest = null
  }

  const requestVersion = dashboardCacheVersion
  dashboardRequest = fetchDashboardData()
    .then((data) => {
      if (requestVersion === dashboardCacheVersion) dashboardCache = data
      return data
    })
    .finally(() => {
      if (requestVersion === dashboardCacheVersion) dashboardRequest = null
    })

  return dashboardRequest
}
