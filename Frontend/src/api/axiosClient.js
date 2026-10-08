// src/api/apiClient.js
import axios from "axios";

const apiClient = axios.create({
    baseURL: "/api",

    withCredentials: true,
});


apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;


        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest

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
