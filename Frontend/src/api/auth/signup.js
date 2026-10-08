import axios from "axios";

export const signUp = async (userData) => {
  try {
    const response = await axios.post("/api/create-account", userData);
    return response.data;
  } catch (error) {
    // Re-throw or format the error response for your UI component
    throw error.response?.data || error.message;
  }
};