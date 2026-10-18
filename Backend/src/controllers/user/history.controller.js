import ApiResponse from "../../utils/ApiResponse.js"
import asyncHandler from "../../utils/asyncHandler.js"
import { History } from "../../models/history/history.models.js"



export const fetchHistory = asyncHandler(async(req,res) => {
    const history = await History.findOne({userId : req.user._id})

    return res.status(200)
    .json(
        new ApiResponse(200 , "fetched user history" , history)
    )
})