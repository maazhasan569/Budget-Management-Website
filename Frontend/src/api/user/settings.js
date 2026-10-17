import apiClient from "@/api/axiosClient"

export async function loadUserSettings() {
  const response = await apiClient.post("/user/update-user", {})
  return response.data?.data
}

export async function saveUserSettings(settings) {
  const response = await apiClient.post("/user/update-user", settings)
  return response.data?.data
}
