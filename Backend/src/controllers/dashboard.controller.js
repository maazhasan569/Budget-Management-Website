import { dashboardService } from "../service/dashboard.service";
import ApiResponse from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandler";

const financialScore = asyncHandler(async (req, res) => {
    const userId = req.user._id

    const dashboard = new dashboardService(userId)
    const userFinancialScore = dashboard.financialScore()

    res.status(200)
        .json(
            new ApiResponse(200, "fetched user financial score", userFinancialScore)

        )
})

const goalProgress = asyncHandler(async (req, res) => {
    const userId = req.user._id

    const dashboard = new dashboardService(userId)
    const userGoalProgress = dashboard.goalProgress()

    res.status(200)
        .json(
            new ApiResponse(200, "fetched user goal Progress", userGoalProgress)

        )
})

const loanProgress = asyncHandler(async (req, res) => {
    const userId = req.user._id

    const dashboard = new dashboardService(userId)
    const userLoanProgress = dashboard.LoanProgress()

    res.status(200)
        .json(
            new ApiResponse(200, "fetched user loan Progress", userLoanProgress)

        )

})

const GoalAndLoanAlert = asyncHandler(async (req,res) => {
    const userId = req.user_.id
    
    const dashboard = new dashboardService(userId)
    const alertUser = dashboard.GoalLoanAlert()

    res.status(200)
        .json(
            new ApiResponse(200, "fetched user alert loans and goals", alertUser)

        )
})

const getFlaggedDocument = asyncHandler(async(req,res) => {
     const userId = req.user_.id
    
    const dashboard = new dashboardService(userId)
    const userFlaggedDocuments = dashboard.flaggedDocs()

    res.status(200)
        .json(
            new ApiResponse(200, "fetched user flagged loan and goals", userFlaggedDocuments)

        )
})

const spendingTrends = asyncHandler(async(req,res) => {
    const userId = req.user_.id
    
    const dashboard = new dashboardService(userId)
    const userSpendingTrends = dashboard.spendingTrends()

    res.status(200)
        .json(
            new ApiResponse(200, "fetched user spendingTrends ", userSpendingTrends)

        )
})

const expenseCategoryPercentages = asyncHandler(async(req,res) => {
    const userId = req.user_.id
    
    const dashboard = new dashboardService(userId)
    const userExpenseCategory = dashboard.expenseCategoryPercentages()

    res.status(200)
        .json(
            new ApiResponse(200, "fetched user expense category in percentage ", userExpenseCategory)

        )

})

export {
    financialScore,
    loanProgress,
    goalProgress,
    GoalAndLoanAlert,
    flaggedDocs,
    spendingTrends,
    expenseCategoryPercentages
}