import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { Users } from "../../models/users.models.js";

const updateIncome = asyncHandler(async(req,res) => {
   
    const { netIncome = 0 , income = 0 } = req.body
    const user = await Users.findById(req.user._id)
    
    if(netIncome && netIncome < 0 ) throw new ApiError(400 , "Invalid net Income")
    if(income && income < 0 ) throw new ApiError(400 , "Invalid Income")   

    income ? user.income += income : user.netIncome += netIncome
    const updatedIncome = await user.save({ validateBeforeSave: false })
    if (!updatedIncome) {
        throw new ApiError(500, "Failed to save user Income")
    }
    return res.status(200)
        .json(
            new ApiResponse(200, "income updated", updatedIncome)
        )
})

const getIncomeAndBackBalance = asyncHandler(async (req, res) => {

    const user = await Users.findById(req.user._id)
    return res.status(200)
        .json(
            new ApiResponse(200, "fetched use income and bankbalance", {
                netIncome: user.netIncome,
                bankBalance: user.bankBalance
            })
        )
})

export {
    getIncomeAndBackBalance,
    updateIncome
}