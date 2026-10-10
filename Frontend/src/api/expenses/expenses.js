import apiClient from "@/api/axiosClient"

const BASE_PATH = "/expenses"

function getResponseData(response) {
  return response.data?.data
}

export async function getExpenses({ page = 1, limit = 8, sortBy = "createdAt", sortType = "desc", category } = {}) {
  const path = category ? `${BASE_PATH}/category` : BASE_PATH
  const response = await apiClient.get(path, {
    params: { page, limit, sortBy, sortType, ...(category ? { category } : {}) },
  })
  const data = getResponseData(response)

  if (Array.isArray(data)) {
    return { expenses: data, totalDoc: data.length, totalPages: 1, page, limit }
  }

  return {
    expenses: Array.isArray(data?.fetchedDoc) ? data.fetchedDoc : [],
    totalDoc: Number(data?.totalDoc) || 0,
    totalPages: Number(data?.totalPages) || 0,
    page: Number(data?.page) || page,
    limit: Number(data?.limit) || limit,
  }
}

export async function getAllExpenseCategories() {
  const response = await apiClient.get(`${BASE_PATH}/category`, {
    params: { page: 1, limit: 1000, sortBy: "category", sortType: "asc" },
  })
  const data = getResponseData(response)
  const expenses = Array.isArray(data) ? data : data?.fetchedDoc
  return [...new Set((expenses ?? []).map((expense) => expense.category).filter(Boolean))].sort((a, b) => a.localeCompare(b))
}

export async function createExpense(expense) {
  const response = await apiClient.post(`${BASE_PATH}/create-expense`, expense)
  return getResponseData(response)
}

export async function updateExpense(expenseId, expense) {
  const response = await apiClient.put(`${BASE_PATH}/edit-expense/${encodeURIComponent(expenseId)}`, expense)
  return getResponseData(response)
}

export async function deleteExpense(expenseId, answers) {
  const response = await apiClient.delete(`${BASE_PATH}/${encodeURIComponent(expenseId)}`, { data: answers })
  return getResponseData(response)
}

