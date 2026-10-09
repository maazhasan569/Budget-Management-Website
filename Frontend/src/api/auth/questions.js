import apiClient from "../axiosClient";

export const submitAnswers= async (questionData) => {
    try {
        const response = await apiClient.post("/user/questions", questionData)
        return response.data
    } catch (error) {
        throw error.response?.data || error.message;
    }
}