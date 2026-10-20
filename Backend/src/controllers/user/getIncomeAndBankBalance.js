import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { Users } from "../../models/users.models.js";
export const getIncomeAndBackBalance = asyncHandler(async (req, res) => {

    const user = await Users.findById(req.user._id)
    return res.status(200)
        .json(
            new ApiResponse(200, "fetched use income and bankbalance", {
                netIncome: user.netIncome,
                bankBalance: user.bankBalance
            })
        )
})