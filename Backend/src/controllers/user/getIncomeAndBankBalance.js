import asyncHandler from "../../utils/asyncHandler";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { Users } from "../../models/users.models";
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