import apiClient from "../axiosClient"
import { setSelectedCurrency } from "@/lib/currency"

export async function logOut() {
  const response = await apiClient.post("/auth/logout")
  localStorage.removeItem("isLoggedIn")
  setSelectedCurrency(null)
  return response.data
}
