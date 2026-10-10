import apiClient from "@/api/axiosClient"
import { invalidateDashboardCache } from "@/api/dashboard/dashboard"

const BASE_PATH = "/expenses"
const expenseCache = new Map()
let expenseCategoriesCache = null
let expenseCacheVersion = 0
let categoriesRequest = null

function normalizeOptions(options = {}) {
  return {
    page: Number(options.page) || 1,
    limit: Number(options.limit) || 8,
    sortBy: options.sortBy || "createdAt",
    sortType: options.sortType || "desc",
    category: options.category || "",
  }
}

function getCacheKey(options) {
  return JSON.stringify(normalizeOptions(options))
}

export function getCachedExpenses(options = {}) {
  const key = getCacheKey(options)
  return expenseCache.has(key) ? expenseCache.get(key) : null
}

export function getCachedExpenseCategories() {
  return expenseCategoriesCache
}

function invalidateExpenseCache() {
  expenseCacheVersion += 1
  expenseCache.clear()
  expenseCategoriesCache = null
  categoriesRequest = null
  invalidateDashboardCache()
}

function getResponseData(response) {
  return response.data?.data
}

export async function getExpenses({ page = 1, limit = 8, sortBy = "createdAt", sortType = "desc", category } = {}) {
  const options = normalizeOptions({ page, limit, sortBy, sortType, category })
  const cacheKey = getCacheKey(options)
  const cachedResult = getCachedExpenses(options)
  if (cachedResult) return cachedResult

  const requestVersion = expenseCacheVersion
  const path = category ? `${BASE_PATH}/category` : BASE_PATH
  const response = await apiClient.get(path, {
    params: { ...options, ...(category ? { category } : {}) },
  })
  const data = getResponseData(response)

  if (Array.isArray(data)) {
    const result = { expenses: data, totalDoc: data.length, totalPages: 1, page, limit }
    if (requestVersion === expenseCacheVersion) expenseCache.set(cacheKey, result)
    return result
  }

  const result = {
    expenses: Array.isArray(data?.fetchedDoc) ? data.fetchedDoc : [],
    totalDoc: Number(data?.totalDoc) || 0,
    totalPages: Number(data?.totalPages) || 0,
    page: Number(data?.page) || page,
    limit: Number(data?.limit) || limit,
  }
  if (requestVersion === expenseCacheVersion) expenseCache.set(cacheKey, result)
  return result
}

export async function getAllExpenseCategories() {
  if (expenseCategoriesCache) return expenseCategoriesCache
  if (categoriesRequest) return categoriesRequest

  const requestVersion = expenseCacheVersion
  categoriesRequest = apiClient.get(`${BASE_PATH}/category`, {
    params: { page: 1, limit: 1000, sortBy: "category", sortType: "asc" },
  }).then((response) => {
    const data = getResponseData(response)
    const expenses = Array.isArray(data) ? data : data?.fetchedDoc
    const categories = [...new Set((expenses ?? []).map((expense) => expense.category).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
    if (requestVersion === expenseCacheVersion) expenseCategoriesCache = categories
    return categories
  }).finally(() => {
    if (requestVersion === expenseCacheVersion) categoriesRequest = null
  })

  return categoriesRequest
}

export async function createExpense(expense) {
  const response = await apiClient.post(`${BASE_PATH}/create-expense`, expense)
  invalidateExpenseCache()
  return getResponseData(response)
}

export async function updateExpense(expenseId, expense) {
  const response = await apiClient.put(`${BASE_PATH}/edit-expense/${encodeURIComponent(expenseId)}`, expense)
  invalidateExpenseCache()
  return getResponseData(response)
}

export async function deleteExpense(expenseId, answers) {
  const response = await apiClient.delete(`${BASE_PATH}/${encodeURIComponent(expenseId)}`, { data: answers })
  invalidateExpenseCache()
  return getResponseData(response)
}
