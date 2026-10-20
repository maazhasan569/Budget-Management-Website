import ApiResponse from "../../utils/ApiResponse.js"
import asyncHandler from "../../utils/asyncHandler.js"
import { History } from "../../models/history/history.models.js"
import { paginate } from "../../utils/pagination.js"
import ApiError from "../../utils/ApiError.js"



export const fetchHistory = asyncHandler(async(req,res) => {
    const history = await History.findOne({userId : req.user._id})
    const userId = req.user._id
    const histortPaginateDoc = await paginate({userId})
    if(!histortPaginateDoc.length){
        throw new ApiError(400 , "No history doc found")
    }
    return res.status(200)
    .json(
        new ApiResponse(200 , "fetched user history" , histortPaginateDoc)
    )
})