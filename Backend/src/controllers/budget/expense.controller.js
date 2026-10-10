import ApiError from "../../utils/ApiError.js"
import asyncHandler from "../../utils/asyncHandler.js"
import { Users } from "../../models/users.models.js"
import { Expense } from "../../models/budget/expense.models.js"
import ApiResponse from "../../utils/ApiResponse.js"
import { ExpenseTracker } from "../../service/expense.service.js"
import { paginate } from "../../utils/pagination.js"

const fieldCheck = (fields) => {
    return fields.some(field => {
        if (typeof field === 'string') {
            return !field || field.trim() === ""
        }
        return !field  // For numbers, null, undefined, etc.
    })
}
const getBudget = asyncHandler(async (req, res) => {
    const user = await Users.findById(req.user._id)
    if (typeof user.remainingBudget !== "number" || Number.isNaN(user.remainingBudget)) {
        throw new ApiError(404, "No user budget found")
    }
    return res.status(200)
        .json(
            new ApiResponse(200, "fetched user budget", user.budget)
        )
})
const updatedBudget = asyncHandler(async (req, res) => {
    const { budget } = req.body
    const user = await Users.findById(req.user._id)
    const isPrevBudget = user.budget > 0 ? true : false
    user.budget = user.budget + budget
    user.remainingBudget += budget
    const updatedBudget = await user.save({ validateBeforeSave: false })
    if (!updatedBudget) {
        throw new ApiError(500, "Failed to save user budget")
    }
    return res.status(200)
        .json(
            new ApiResponse(200, isPrevBudget ? "budget update,previous budget added" : "budget updated", updatedBudget)
        )
})
const createExpense = asyncHandler(async (req, res) => {
    //if there is any loan,goal,
    //if there a budget
    //deduct the amt saved for loan and goals from budget
    //in loans and goals section
    //check the spending trends of user->(frontend)

    const { name, amount, category } = req.body
    const check = fieldCheck([name, amount])

    if (check) {
        throw new ApiError(400, "All fields are required")
    }
    const user = await Users.findById(req.user._id)
    const userBudget = user.remainingBudget
    if (!userBudget) {
        throw new ApiError(404, "No budget found")
    }
    const manageExpense = new ExpenseTracker(userBudget, req.user._id)
    const createExpense = await manageExpense.addExpense(name, amount, category)
    const { updatedBudget, totalSpend } = await manageExpense.getAndSaveRemainingBudget(createExpense._id)

    return res.status(201)
        .json(
            new ApiResponse(201, "Expense created", { createExpense, updatedBudget, totalSpend })
        )

})

const editExpense = asyncHandler(async (req, res) => {
    const { name, amount, category } = req.body
    const { expenseId } = req.params
    const userId = req.user._id
    const check = fieldCheck([name, amount])
    if (check) {
        throw new ApiError(400, "All fields are required")
    }

    const expenseDoc = await Expense.findOne({userId , _id : expenseId })
    const userDoc = await Users.findById(req.user._id)
    userDoc.remainingBudget += expenseDoc.amount

    await userDoc.save({ validateBeforeSave: false })
    const updatedUser = await Users.findById(req.user._id)
    const expense = new ExpenseTracker(updatedUser.remainingBudget, req.user._id)
    const updateExpense = await expense.editExpense(expenseId, name, category, amount)
    const { updatedBudget } = await expense.getAndSaveRemainingBudget(updateExpense._id)
    return res.status(200)
        .json(
            new ApiResponse(200, "Expense created", { updateExpense, updatedBudget })
        )
})

const showAllExpense = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sortBy, sortType, } = req.query
    const userId = req.user._id
    const options = {
        page,
        limit,
        sortBy,
        sortType,
        userId
    }
    const getAllExpenses = await paginate(Expense, options)
    if (!getAllExpenses.fetchedDoc.length) {
        return res.status(200)
            .json(
                new ApiResponse(200, "No Expense found", [])
            )
    }
    return res.status(200)
        .json(
            new ApiResponse(200, "fetched user expenses", getAllExpenses)
        )
})

const deleteExpense = asyncHandler(async (req, res) => {
    //delete accidently or refund
    //Q1 : Did money actually leave your account for this?
    //Q2 : Did you receive money back (a refund)
    const { expenseId } = req.params
    const { ans1, ans2 } = req.body
    const user = await Users.findById(req.user._id)
    const expense = new ExpenseTracker(user.budget, user._id)
    const { message, restoreBudget, newBudget } = await expense.delExpense(expenseId, ans1, ans2)
    return res.status(200)
        .json(
            new ApiResponse(200, message, { restoreBudget, newBudget })
        )


})
const getExpenseCategory = asyncHandler(async (req, res) => {
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
    const expensesData = await paginate(Expense, options)
    if (!expensesData.fetchedDoc.length ) {
        return res.status(200)
            .json(
                new ApiResponse(200, "No expense found by category", expensesData)
            )
    }
    return res.status(200)
        .json(
            new ApiResponse(200, "Expense fetched by category", expensesData)
        )
})
const getExpenseById = asyncHandler(async (req, res) => {
    const { expenseId } = req.params
    const userId = req.user._id
    const getExpense = await Expense.findOne({ _id : expenseId, userId })
    if (!getExpense) {
        return res.status(200)
            .json(
                new ApiResponse(200, "No expense found By id", {})
            )
    }
    return res.status(200)
        .json(
            new ApiResponse(200, "Expense fetched by id", getExpense)
        )
})

export {
    getBudget,
    createExpense,
    editExpense,
    deleteExpense,
    showAllExpense,
    getExpenseById,
    getExpenseCategory,
    updatedBudget
}