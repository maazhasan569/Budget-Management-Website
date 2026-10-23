import apiClient from "@/api/axiosClient"

const BASE_PATH = "/tasks"

function responseData(response) {
  return response.data?.data
}

function taskError(error, fallback) {
  const message = error?.response?.data?.message
  if (typeof message === "string" && /model\.findone is not a function/i.test(message)) {
    return new Error("The server could not save this task to history. Please check the task history integration.", { cause: error })
  }
  return new Error(typeof message === "string" ? message : fallback, { cause: error })
}

function normalizeTaskPage(data, page, limit) {
  return {
    tasks: Array.isArray(data?.fetchedDoc) ? data.fetchedDoc : [],
    totalDoc: Number(data?.totalDoc) || 0,
    totalPages: Number(data?.totalPages) || 0,
    page: Number(data?.page) || page,
    limit: Number(data?.limit) || limit,
  }
}

async function getTaskPage(path, { page, limit, sortBy, sortType, category }) {
  try {
    const response = await apiClient.get(path, {
      params: { page, limit, sortBy, sortType, ...(category ? { category } : {}) },
    })
    return normalizeTaskPage(responseData(response), page, limit)
  } catch (error) {
    if (
      error?.response?.status === 404 &&
      String(error?.response?.data?.message ?? "").toLowerCase().includes("task not found")
    ) {
      return { tasks: [], totalDoc: 0, totalPages: 0, page, limit }
    }
    throw taskError(error, "We couldn’t load your tasks. Please try again.")
  }
}

export async function getTasks({ page = 1, limit = 10, sortBy = "createdAt", sortType = "desc", category } = {}) {
  return getTaskPage(category ? `${BASE_PATH}/category` : BASE_PATH, {
    page,
    limit,
    sortBy,
    sortType,
    category,
  })
}

export async function getTaskById(taskId) {
  try {
    const response = await apiClient.get(`${BASE_PATH}/${encodeURIComponent(taskId)}`)
    return responseData(response)
  } catch (error) {
    throw taskError(error, "We couldn’t load this task. Please try again.")
  }
}

export async function getTaskCategories() {
  try {
    const { tasks } = await getTaskPage(`${BASE_PATH}/category`, {
      page: 1,
      limit: 1000,
      sortBy: "category",
      sortType: "asc",
    })
    return [...new Set(tasks.map((task) => task.category?.trim()).filter(Boolean))]
      .sort((left, right) => left.localeCompare(right))
  } catch (error) {
    throw taskError(error, "We couldn’t load task categories. Please try again.")
  }
}

export async function createTask({ taskName, taskDescription, category, dateValue, dueDateUnit, document }) {
  const formData = new FormData()
  formData.append("taskName", taskName)
  formData.append("taskDescription", taskDescription)
  formData.append("category", category ?? "")
  if (dateValue && dueDateUnit) {
    formData.append("dateValue", dateValue)
    formData.append("dueDateUnit", dueDateUnit)
  }
  if (document) formData.append("document", document)

  try {
    const response = await apiClient.post(`${BASE_PATH}/create-task`, formData)
    return responseData(response)
  } catch (error) {
    throw taskError(error, "We couldn’t create this task. Please try again.")
  }
}

export async function updateTask(taskId, { taskName, taskDescription, category, document }) {
  const formData = new FormData()
  formData.append("taskName", taskName)
  formData.append("taskDescription", taskDescription)
  if (category) formData.append("category", category)
  if (document) formData.append("document", document)

  try {
    const response = await apiClient.put(
      `${BASE_PATH}/${encodeURIComponent(taskId)}`,
      formData,
    )
    return responseData(response)
  } catch (error) {
    throw taskError(error, "We couldn’t update this task. Please try again.")
  }
}

export async function completeTask(taskId) {
  try {
    const response = await apiClient.put(`${BASE_PATH}/${encodeURIComponent(taskId)}/mark-complete`)
    return responseData(response)
  } catch (error) {
    throw taskError(error, "We couldn’t complete this task. Please try again.")
  }
}

export async function deleteTask(taskId) {
  try {
    const response = await apiClient.delete(`${BASE_PATH}/${encodeURIComponent(taskId)}`)
    return responseData(response)
  } catch (error) {
    throw taskError(error, "We couldn’t remove this task. Please try again.")
  }
}
