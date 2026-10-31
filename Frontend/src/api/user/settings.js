import apiClient from "@/api/axiosClient"
import { invalidateDashboardCache } from "@/api/dashboard/dashboard"

export async function loadUserSettings() {
  const response = await apiClient.post("/user/update-user", {})
  return response.data?.data
}

export async function saveUserSettings(settings) {
  const response = await apiClient.post("/user/update-user", settings)
  invalidateDashboardCache()
  return response.data?.data
}

export async function saveUserPaymentSettings(settings) {
  const response = await apiClient.patch("/user/update-payment-setting", settings)
  return response.data?.data
}

export async function scheduleMonthlyCredentialsUpdate() {
  const response = await apiClient.put("/expenses/update-crendentials")
  return response.data?.data
}
