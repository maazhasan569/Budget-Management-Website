import apiClient from "../axiosClient";
import { markAuthenticated } from "./session"
import { setSelectedCurrency } from "@/lib/currency"

export const signIn = async (userData) => {
  try {
    const response = await apiClient.post("/auth/login", userData);
    markAuthenticated(response.data?.data?.loggedInUser?._id)
    localStorage.setItem("isLoggedIn", "true"); 
    setSelectedCurrency(response.data?.data?.loggedInUser?.currency)
    return response.data;
  } catch (error) {
    // Re-throw or format the error response for your UI component
    throw error.response?.data || error.message;
  }
};
