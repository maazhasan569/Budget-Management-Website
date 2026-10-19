import apiClient from "../axiosClient"

let currentUserRequest = null
let authenticatedUserId = null
const authStateListeners = new Set()

function notifyAuthState(status) {
  for (const listener of authStateListeners) listener(status)
}

export function subscribeToAuthState(listener) {
  authStateListeners.add(listener)
  return () => authStateListeners.delete(listener)
}

export function markAuthenticated(userId) {
  if (!userId) return
  authenticatedUserId = userId
  notifyAuthState("authenticated")
}

export function clearAuthenticatedUser() {
  authenticatedUserId = null
  notifyAuthState("anonymous")
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
