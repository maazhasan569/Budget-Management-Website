// src/api/apiClient.js
import axios from "axios";

const apiClient = axios.create({
    baseURL: "/api/v1",
    withCredentials: true,
});


apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;


        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            try {


                await axios.post("/api/refresh-token", {}, { withCredentials: true });

                return apiClient(originalRequest);
            } catch (refreshError) {


                localStorage.removeItem("isLoggedIn");
                window.location.href = "/login";
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
