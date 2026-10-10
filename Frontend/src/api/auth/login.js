import apiClient from "../axiosClient";
import { setSelectedCurrency } from "@/lib/currency"

export const signIn = async (userData) => {
  try {
    const response = await apiClient.post("/auth/login", userData);
    localStorage.setItem("isLoggedIn", "true"); 
    setSelectedCurrency(response.data?.data?.loggedInUser?.currency)
    return response.data;
  } catch (error) {
    // Re-throw or format the error response for your UI component
    throw error.response?.data || error.message;
  }
};
