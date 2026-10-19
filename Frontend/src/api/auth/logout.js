import apiClient from "../axiosClient"
import { clearAuthenticatedUser } from "./session"
import { setSelectedCurrency } from "@/lib/currency"

export async function logOut() {
  const response = await apiClient.post("/auth/logout")
  clearAuthenticatedUser()
  localStorage.removeItem("isLoggedIn")
  setSelectedCurrency(null)
  return response.data
}
