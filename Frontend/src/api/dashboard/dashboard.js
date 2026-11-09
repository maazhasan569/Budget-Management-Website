import apiClient from "@/api/axiosClient"

let dashboardCache = null
let dashboardRequest = null
let dashboardCacheVersion = 0

const endpointPaths = {
  budget: "/expenses/budget",
  incomeAndBalance: "/user/income-bankbalance",
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

function toFiniteNumber(value) {
  if (value == null || value === "") return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

async function fetchDashboardData() {
  const [
    budgetResult,
    incomeAndBalanceResult,
    goalsResult,
    loansResult,
    alertsResult,
    flaggedResult,
    trendsResult,
    categoriesResult,
    scoreResult,
  ] = await Promise.allSettled([
    requestData(endpointPaths.budget),
    requestData(endpointPaths.incomeAndBalance),
    requestData(endpointPaths.goals),
    requestData(endpointPaths.loans),
    requestData(endpointPaths.alerts),
    requestData(endpointPaths.flagged),
    requestData(endpointPaths.trends),
    requestData(endpointPaths.categories),
    requestData(endpointPaths.score),
  ])

  const budgetUnavailable =
    budgetResult.status === "rejected" && budgetResult.reason?.response?.status === 404
  const budget = budgetUnavailable ? null : resultValue(budgetResult, null)
  const incomeAndBalance = resultValue(incomeAndBalanceResult, {})
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

  const alerts = resultValue(alertsResult, [])
  const flagged = resultValue(flaggedResult, { flaggedGoals: [], flaggedLoans: [] })
  const categoryUnavailable =
    categoriesResult.status === "rejected" &&
    categoriesResult.reason?.response?.status === 400
  const categoryPercentages = categoryUnavailable
    ? {}
    : resultValue(categoriesResult, {})
  let score = 100
  const errors = {
    budget: hasRequestError(budgetResult) && !budgetUnavailable,
    incomeAndBalance: hasRequestError(incomeAndBalanceResult),
    goals: hasRequestError(goalsResult),
    loans: hasRequestError(loansResult),
    alerts: hasGoalOrLoanData && hasRequestError(alertsResult),
    flagged: hasGoalOrLoanData && hasRequestError(flaggedResult),
    trends: hasRequestError(trendsResult),
    categories: hasRequestError(categoriesResult) && !categoryUnavailable,
    score: false,
  }

  if (hasScoreInputs) {
    if (scoreResult.status === "fulfilled") {
      const fetchedScore = scoreResult.value
      const numericScore = Number(fetchedScore)
      if (Number.isFinite(numericScore)) score = numericScore
      else errors.score = true
    } else errors.score = true
  }

  return {
    budget: Number.isFinite(budget) ? budget : null,
    netIncome: toFiniteNumber(incomeAndBalance?.netIncome),
    bankBalance: toFiniteNumber(incomeAndBalance?.bankBalance),
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

export async function addToNetIncome(amount) {
  const response = await apiClient.patch("/user/update-income", { netIncome: amount })
  invalidateDashboardCache()
  return response.data?.data
}

export async function addToNetBudget(amount) {
  const response = await apiClient.patch("/expenses/update-budget", { netbudget: amount })
  invalidateDashboardCache()
  return response.data?.data
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
