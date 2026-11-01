import apiClient from "../axiosClient";
import { toFriendlyError } from "@/api/errors"
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
    throw toFriendlyError(error, "We couldn’t sign you in right now. Please try again.")
  }
};
