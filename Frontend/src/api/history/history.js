import apiClient from "@/api/axiosClient"

export async function getHistory() {
  const response = await apiClient.get("/user/history")
  const history = response.data?.data

  if (history == null) {
    return { expenses: [], goals: [], loans: [], tasks: [] }
  }
  if (typeof history !== "object" || Array.isArray(history)) {
    throw new Error("The history response was not in the expected format.")
  }

  for (const field of ["expenses", "goals", "loans", "tasks"]) {
    if (history[field] != null && !Array.isArray(history[field])) {
      throw new Error("The history response was not in the expected format.")
    }
  }

  return {
    expenses: history.expenses ?? [],
    goals: history.goals ?? [],
    loans: history.loans ?? [],
    tasks: history.tasks ?? [],
  }
}
