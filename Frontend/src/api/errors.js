const DEFAULT_ERROR = "We couldn’t complete that request. Please try again."

const friendlyMessages = [
  [/invalid email or password|email or password is incorrect/i, "Email or password is incorrect. Check your details and try again."],
  [/unauthorized|invalid access.?token|invalid refresh token|token (?:not found|expired)/i, "Your session may have expired. Sign in and try again."],
  [/invalid income.*budget must be below monthly income/i, "Your budget must be lower than your monthly income."],
  [/invalid bank balance/i, "Enter a valid bank balance."],
  [/only one value.*at a time/i, "Update either income or budget at a time."],
  [/expense amount exceeds budget/i, "This amount is over your remaining budget. Enter a smaller amount."],
  [/invalid expense amount|invalid budget|invalid net budget|invalid income|invalid net income/i, "Enter a valid amount greater than zero."],
  [/no budget found|no user budget found/i, "There isn’t an available budget for expenses yet. Set up a budget first."],
  [/all fields required|all fields are required/i, "Complete all required fields and try again."],
  [/invalid unit provided|invalid date value/i, "Choose a valid due date and time unit."],
  [/task (?:id )?not found|invalid task id|goals? not found|loans? not found|expense not found|file not found/i, "This item is no longer available. Refresh the page and try again."],
  [/cant be more than targetamt/i, "That amount is higher than the remaining target."],
  [/targetamt|target amount/i, "Enter a valid target amount."],
  [/monthly amt already paid/i, "You’ve already made this contribution this month."],
  [/netincome not enough|too large/i, "Your available income is too low for this amount."],
  [/overdued/i, "This item has passed its due date. Update it before continuing."],
  [/invalid (?:loan deletion reason|expense deletion ans)/i, "Choose one of the listed reasons and try again."],
  [/payday or autoapplymonthly is required/i, "Choose a payday and enable automatic monthly updates to save these payment settings."],
  [/invalid file type|file type.*not found/i, "Choose a supported file type and try again."],
]

export function getFriendlyErrorMessage(error, fallback = DEFAULT_ERROR) {
  const status = Number(
    error?.response?.status ??
      error?.response?.data?.statusCode ??
      error?.statusCode,
  )
  const message =
    typeof error?.response?.data?.message === "string"
      ? error.response.data.message
      : typeof error?.message === "string"
        ? error.message
        : ""

  for (const [pattern, friendlyMessage] of friendlyMessages) {
    if (pattern.test(message)) return friendlyMessage
  }

  if (status === 401 || status === 403) {
    return "Your session may have expired. Sign in and try again."
  }
  if (status === 429) return "You’re making requests too quickly. Wait a moment and try again."
  if (status >= 500) return "We’re having trouble completing this right now. Please try again."
  if (!error?.response && error?.isAxiosError) {
    return "We couldn’t connect. Check your internet connection and try again."
  }

  return fallback
}

export function toFriendlyError(error, fallback = DEFAULT_ERROR) {
  const friendlyError = new Error(getFriendlyErrorMessage(error, fallback), { cause: error })
  const statusCode = Number(
    error?.response?.status ??
      error?.response?.data?.statusCode ??
      error?.statusCode,
  )

  if (Number.isInteger(statusCode)) friendlyError.statusCode = statusCode
  return friendlyError
}
