import apiClient from "../axiosClient"

let currentUserRequest = null

export function verifyCurrentUser() {
  if (!currentUserRequest) {
    currentUserRequest = apiClient
      .get("/auth/redirect")
      .then((response) => {
        const userId = response.data?.data
        if (!userId) {
          throw new Error("The authentication response did not include a user ID.")
        }
        return userId
      })
      .finally(() => {
        currentUserRequest = null
      })
  }

  return currentUserRequest
}
