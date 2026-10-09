import apiClient from "../axiosClient";

export const submitAnswers = async (questionData) => {
    try {
        console.log(questionData)
        const response = await apiClient.post("/user/question", questionData)
        return response.data
    } catch (error) {
        throw error.response?.data || error.message;
    }
}