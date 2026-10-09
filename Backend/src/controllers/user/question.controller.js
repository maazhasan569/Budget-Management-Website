import { Users } from "../../models/users.models.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

export const questions = asyncHandler(async (req, res) => {
    const { identity, currency, income, budget , bankBalance } = req.body
    const fieldCheck = [identity, currency, income, budget , bankBalance].some((fields) => {
        if (fields == null || fields === "") return true;
    
    // Only call .trim() if it's actually a string
    if (typeof fields === "string") {
        return fields.trim() === "";
    }
    
    if (!fields) return !fields
    })
    if(fieldCheck){
        throw new ApiError(400 , "all fields are required")
    }
    if (!income > 0 || budget > income) {
        throw new ApiError(400, "invalid income Or Budget must be below monthly income")
    }

    if(!bankBalance > 0){
        throw new ApiError(400 , "Invalid Bank Balance")
    }

    const saveCredentials = await Users.findByIdAndUpdate(
        req.user._id,
        {
            identity,
            currency,
            income,
            netIncome : income - budget,
            remainingBudget : budget,
            budget,
            bankBalance,
        },
        { new: true }
    )
    if (!saveCredentials) {
        throw new ApiError(500, "failed to save credentials")
    }
    return res.status(200)
        .json(
            new ApiResponse(200, `saved usercredentials`, saveCredentials)
        )

})