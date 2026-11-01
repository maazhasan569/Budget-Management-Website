import apiClient from "../axiosClient";
import { toFriendlyError } from "@/api/errors"
import { markAuthenticated } from "./session"
import { setSelectedCurrency } from "@/lib/currency"

export const signUp = async (userData) => {
  try {
    const response = await apiClient.post("/auth/create-account", userData);
    markAuthenticated(response.data?.data?.user?._id)
    localStorage.setItem("isLoggedIn", "true"); 
    setSelectedCurrency(null)
    return response.data;
  } catch (error) {
    throw toFriendlyError(error, "We couldn’t create your account right now. Please try again.")
  }
};
