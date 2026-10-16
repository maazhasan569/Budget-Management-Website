import { Goal } from "../../models/budget/goals.models.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { paginate } from "../../utils/pagination.js";
import { GoalService } from "../../service/goal.service.js";
import ApiError from "../../utils/ApiError.js";





const createGoal = asyncHandler(async (req, res) => {
    const { name, targetAmount,  type, duration, category , autoDeduction } = req.body
    const userId = req.user._id
    const goal = new GoalService(userId, {
        name,
        targetAmount,
        autoDeduction,
        frequency : type,
        duration,
        category,
    })
    const newGoal = await goal.createGoal()

    return res.status(200)
        .json(
            new ApiResponse(200, "Goal created", newGoal)
        )

})
const getGoalById = asyncHandler(async (req, res) => {
    const { goalId } = req.params
    const userId = req.user._id
    const getGoal = await Goal.findOne({ _id : goalId, userId })
    res.status(200)
        .json(
            new ApiResponse(200, getGoal ? "Goal fetched" : "Goal not found by Id", getGoal)
        )

})
const getAllGoals = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sortBy, sortType, } = req.query
    const userId = req.user._id
    const options = {
        page,
        limit,
        sortBy,
        sortType,
        userId
    }
    const goal = new GoalService(userId)
    await goal.setUnachievedStatus()
    const goalsData = await paginate(Goal, options)
    if (!goalsData.fetchedDoc.length) {
        throw new ApiError(404, "Goals not found")
    }
    return res.status(200)
        .json(
            new ApiResponse(200, "fetched All goals", goalsData)
        )
})
const getGoalsByCategory = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sortBy, sortType, category } = req.query
    const userId = req.user._id
    const options = {
        page,
        limit,
        sortBy: sortBy || "createdAt",
        sortType: sortType || "asc",
        category,
        userId
    }

    const goalsData = await paginate(Goal, options)
    if (!goalsData.fetchedDoc.length) {
        throw new ApiError(404, "Goals not found")
    }
    return res.status(200)
        .json(
            new ApiResponse(200, "fetched user goal by category", goalsData)
        )

})

const editGoal = asyncHandler(async (req, res) => {
    const { name, targetAmount, type, duration, category , autoDeduction} = req.body
    const { goalId } = req.params
    const goal = new GoalService(req.user._id, {
        name,
        targetAmount,
        frequency : type,
        duration,
        category,
        autoDeduction
    })
    const updateGoal = await goal.editGoal(goalId)
    if (!updateGoal) {
        throw new ApiError(404, "Goal not found")
    }
    return res.status(200)
        .json(
            new ApiResponse(200, "Goal updated", updateGoal
            )
        )
})

const delGoal = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const { goalId } = req.params
    const goal = new GoalService(userId)
    const del = await goal.deleteGoal(goalId)

    if (!del) {
       throw new ApiError(404 , "Goal not found")
    }

    return res.status(200)
        .json(
            new ApiResponse(200, "Goal deleted", del)
        )
})

const autoDeductAmt = asyncHandler(async (req, res) => {
    //fetch user goal
    const userId = req.user._id
    const goal = new GoalService(userId)
    const deductAmtData = await goal.autoDeductAmt()

    return res.status(200)
        .json(
            new ApiResponse(200, "Goal amt deducted. Goal andUser updated", deductAmtData)
        )

})
const manualDeduction = asyncHandler(async (req, res) => {

    const { goalId } = req.params
    
    const { amount } = req.body
    const userId = req.user._id

    const goal = new GoalService(userId)
    const deductAmtData = await goal.manualDeduction(amount, goalId)
    console.log(deductAmtData)
    return res.status(200)
        .json(
            new ApiResponse(200, "Goal amt deducted. Goal and User updated", deductAmtData)
        )

})
const totalGoalsAmtPaid = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const goal = new GoalService(userId)
    const amtPaidData = await goal.AmtPaid()
    return res.status(200)
    .json(
        new ApiResponse(200 , "fetched money spend on goals" , amtPaidData)
    )
})
const totalGoalsAmtRemaining = asyncHandler(async(req,res) => {

    const userId = req.user._id

    const goal = new GoalService(userId)
    const goalsDueAmt = await goal.AmtRemaining()
    return res.status(200)
    .json(
        new ApiResponse(200 , "fetched money due on goals" , goalsDueAmt)
    )
})

export  {
    createGoal,
    getAllGoals,
    getGoalById,
    getGoalsByCategory,
    delGoal,
    autoDeductAmt,
    manualDeduction,
    totalGoalsAmtPaid,
    totalGoalsAmtRemaining,
    editGoal,
}