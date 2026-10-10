import apiClient from "../axiosClient";
import { setSelectedCurrency } from "@/lib/currency"

export const submitAnswers = async (questionData) => {
    try {
        const response = await apiClient.post("/user/question", questionData)
        setSelectedCurrency(response.data?.data?.currency ?? questionData.currency)
        return response.data
    } catch (error) {
        throw error.response?.data || error.message;
    }
}
