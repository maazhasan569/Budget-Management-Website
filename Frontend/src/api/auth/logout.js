import apiClient from "../axiosClient"

export async function logOut() {
  const response = await apiClient.post("/auth/logout")
  localStorage.removeItem("isLoggedIn")
  return response.data
}
