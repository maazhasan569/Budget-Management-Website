import apiClient from "@/api/axiosClient"
import { toFriendlyError } from "@/api/errors"

export async function sendPasswordResetEmail(email) {
  try {
    const response = await apiClient.post("/auth/send-email", { email })
    return response.data
  } catch (error) {
    throw toFriendlyError(error, "We couldn’t send the reset link. Please try again.")
  }
}

export async function resetPassword(token, newPassword) {
  try {
    const response = await apiClient.post("/auth/reset-password", {
      token,
      newPassword,
    })
    return response.data
  } catch (error) {
    throw toFriendlyError(error, "We couldn’t update your password. Please try again.")
  }
}
