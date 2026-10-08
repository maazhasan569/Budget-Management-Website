import axios from "axios";
import apiClient from "../axiosClient";
export const signIn = async (userData) => {
  try {
    const response = await apiClient.post("/auth/login", userData);
    localStorage.setItem("isLoggedIn", "true"); 
    console.log(response)
    return response.data;
  } catch (error) {
    // Re-throw or format the error response for your UI component
    throw error.response?.data || error.message;
  }
};