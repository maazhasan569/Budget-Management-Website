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
