import apiClient from "../axiosClient";
import { toFriendlyError } from "@/api/errors"
import { setSelectedCurrency } from "@/lib/currency"

export const submitAnswers = async (questionData) => {
    try {
        const response = await apiClient.post("/user/question", questionData)
        setSelectedCurrency(response.data?.data?.currency ?? questionData.currency)
        return response.data
    } catch (error) {
        throw toFriendlyError(error, "We couldn’t finish setting up your account. Please try again.")
    }
}
