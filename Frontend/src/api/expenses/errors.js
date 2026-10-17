const fallbackMessages = {
  load: "We couldn’t load your expenses. Please try again.",
  save: "Could not save your expense. Please try again.",
  update: "Could not update your expense. Please try again.",
  delete: "Could not remove this expense. Please try again.",
  categories: "Could not load expense categories. Please try again.",
}

export function getFriendlyExpenseError(error, action = "load") {
  const response = error?.response?.data
  const message = typeof response?.message === "string"
    ? response.message
    : typeof error?.message === "string"
      ? error.message
      : ""
  const normalizedMessage = message.trim().toLowerCase()
  const statusCode = Number(response?.statusCode ?? error?.response?.status ?? error?.statusCode)

  if (normalizedMessage.includes("expense amount exceeds budget")) {
    return "This amount is over your remaining budget. Enter a smaller amount."
  }
  if (
    normalizedMessage === "invalid expense amount" ||
    normalizedMessage === "invalid budget"
  ) {
    return "Enter an amount greater than zero."
  }
  if (
    /^invalid budget\s*:/.test(normalizedMessage) ||
    normalizedMessage.includes("no budget found") ||
    normalizedMessage.includes("no user budget found")
  ) {
    return "There isn’t an available budget for expenses yet. Set up a budget first."
  }
  if (normalizedMessage.includes("all fields are required")) {
    return "Enter an expense name and a valid amount."
  }
  if (normalizedMessage.includes("invalid expense deletion ans")) {
    return "Choose one of the listed reasons for removing this expense."
  }
  if (normalizedMessage.includes("expense not found")) {
    return "This expense is no longer available. Refresh the list and try again."
  }
  if (statusCode === 401 || statusCode === 403) {
    return "Your session may have expired. Sign in and try again."
  }
  if (normalizedMessage.includes("no user id")) {
    return "Your session may have expired. Sign in and try again."
  }

  return fallbackMessages[action] ?? fallbackMessages.load
}
