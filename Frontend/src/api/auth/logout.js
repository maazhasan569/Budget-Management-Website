import apiClient from "../axiosClient"
import { clearAuthenticatedUser } from "./session"
import { setSelectedCurrency } from "@/lib/currency"

export async function logOut() {
  try {
    const response = await apiClient.post("/auth/logout")
    return response.data
  } finally {
    clearAuthenticatedUser()
    localStorage.removeItem("isLoggedIn")
    setSelectedCurrency(null)
  }
}
