import axios from "axios";
import apiClient from "../axiosClient";
export const signUp = async (userData) => {
  try {
    const response = await apiClient.post("/auth/create-account", userData);
    localStorage.setItem("isLoggedIn", "true"); 
    console.log(response.data)
    return response.data;
  } catch (error) {
    // Re-throw or format the error response for your UI component
    throw error.response?.data || error.message;
  }
};

