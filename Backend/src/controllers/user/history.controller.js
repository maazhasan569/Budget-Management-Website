import ApiResponse from "../../utils/ApiResponse.js"
import asyncHandler from "../../utils/asyncHandler.js"
import { History } from "../../models/history/history.models.js"
import { paginate } from "../../utils/pagination.js"
import ApiError from "../../utils/ApiError.js"



export const fetchHistory = asyncHandler(async(req,res) => {
    
    const userId = req.user._id
    const histortPaginateDoc = await paginate(History , {userId})
    if(histortPaginateDoc.fetchedDoc.length === 0){
        throw new ApiError(400 , "No histroy doc found")
    }
    return res.status(200)
    .json(
        new ApiResponse(200 , "fetched user history" , histortPaginateDoc)
    )
})