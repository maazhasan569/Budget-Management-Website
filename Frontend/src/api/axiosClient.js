// src/api/apiClient.js
import axios from "axios";

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
export const API_BASE_URL = (
    import.meta.env.PROD ? configuredApiBaseUrl || "/api/v1" : "/api/v1"
).replace(/\/+$/, "")
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

let refreshRequest = null;

function refreshAccessToken() {
    if (!refreshRequest) {
        refreshRequest = axios
            .get(`${API_BASE_URL}/auth/refresh-token`, { withCredentials: true })
            .finally(() => {
                refreshRequest = null;
            });
    }

    return refreshRequest;
}

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const isPasswordAuthRequest =
            originalRequest?.url?.includes("/auth/login") ||
            originalRequest?.url?.includes("/auth/create-account")

        if (
            error.response?.status === 401 &&
            !isPasswordAuthRequest &&
            !originalRequest?._retry
        ) {
            originalRequest._retry = true

            try {
                await refreshAccessToken();
                return apiClient(originalRequest);
            } catch (refreshError) {
                const refreshStatus = refreshError?.response?.status
                if (refreshStatus === 401 || refreshStatus === 403) {
                    localStorage.removeItem("isLoggedIn");
                    if (
                        window.location.pathname !== "/" &&
                        window.location.pathname !== "/auth/login"
                    ) {
                        window.location.replace("/");
                    }
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
