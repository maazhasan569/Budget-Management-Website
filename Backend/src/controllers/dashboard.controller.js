import { dashboardService } from "../service/dashboard.service";
import ApiResponse from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandler";

const financialScore = asyncHandler((req,res) => {
    const userId = req.user._id

    const dashboard = new dashboardService(userId)
    const userFinancialScore = dashboard.financialScore()

    res.status(200)
    .json(
        new ApiResponse(200 , "fetched user financial score" , userFinancialScore)

    )
})

const goalProgress = asyncHandler((req,res) => {
    const userId = req.user._id

    const dashboard = new dashboardService(userId)
    const userGoalProgress = dashboard.goalProgress()

    res.status(200)
    .json(
        new ApiResponse(200 , "fetched user goal Progress" , userGoalProgress)
        
    )
})