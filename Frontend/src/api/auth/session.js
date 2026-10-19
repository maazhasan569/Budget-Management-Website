import apiClient from "../axiosClient"

let currentUserRequest = null
let authenticatedUserId = null

export function markAuthenticated(userId) {
  authenticatedUserId = userId || null
}

export function clearAuthenticatedUser() {
  authenticatedUserId = null
}

export function verifyCurrentUser() {
  if (authenticatedUserId) return Promise.resolve(authenticatedUserId)

  if (!currentUserRequest) {
    currentUserRequest = apiClient
      .get("/auth/redirect")
      .then((response) => {
        const userId = response.data?.data
        if (!userId) {
          throw new Error("The authentication response did not include a user ID.")
        }
        authenticatedUserId = userId
        return userId
      })
      .finally(() => {
        currentUserRequest = null
      })
  }

  return currentUserRequest
}
