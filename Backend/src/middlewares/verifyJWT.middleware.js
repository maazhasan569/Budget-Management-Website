import { Users } from "../models/users.models.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

export const verfiyJWTAccessToken = asyncHandler(async(req,res,next) => {
    try{
        const accessToken = req.cookies.accessToken || req.header("Authorization")
    .replace("Bearer " , "")
    if(!accessToken){
        throw new ApiError(401 , "Unauthorized req - token not found")
    }
    const decodedToken = jwt.verify(accessToken , process.env.ACCESS_TOKEN_SECRET)
    const isUser = await Users.findById(decodedToken.userId)
    if(!isUser){
        throw new ApiError(401 , "invalid accesstoken")
    }
    req.user = isUser
    next()
    }catch(err){
        throw new ApiError(401 , err.message)
    }
})