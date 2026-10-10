import apiClient from "../axiosClient";
import { setSelectedCurrency } from "@/lib/currency"

export const signUp = async (userData) => {
  try {
    const response = await apiClient.post("/auth/create-account", userData);
    localStorage.setItem("isLoggedIn", "true"); 
    setSelectedCurrency(null)
    return response.data;
  } catch (error) {
    // Re-throw or format the error response for your UI component
    throw error.response?.data || error.message;
  }
};

