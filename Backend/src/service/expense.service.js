import ApiError from "../utils/ApiError.js"
import { Expense } from "../models/budget/expense.models.js"
import { Users } from "../models/users.models.js"
import { paginate } from "../utils/pagination.js"
import { History } from "../models/history.models.js"
import pushToHistory from "../utils/pushToHistory.js"

export class ExpenseTracker {
    constructor(budget, userId) {
        if (!budget || budget <= 0) {
            throw new ApiError(400, `Invalid budget :${budget}`)
        }
        if (!userId) {
            throw new ApiError(400, "No user Id")
        }
        this.remaingingBudget = budget,
            this.userId = userId

    }
    async addExpense(name, amount, category = "General") {

        if (!amount || amount <= 0) {
            throw new ApiError(400, "Invalid expense amount")
        }
        if (amount > this.remaingingBudget) {
            throw new ApiError(400, "Expense amount exceeds budget")
        }


        try {
            const createExpense = await Expense.create({
                userId: this.userId,
                amount,
                category,
                name,
            })
            return createExpense;
        } catch (error) {
            throw new ApiError(500, error.message)
        }

    }
    async editExpense(expenseId, name, category, amount) {
        if (!amount || amount <= 0) {
            throw new ApiError(400, "Invalid budget")
        }

        if (amount > this.remaingingBudget) {
            throw new ApiError(400, "Expense amount exceeds budget")
        }
        try {
            const updateUserExpense = await Expense.findOneAndUpdate(
                { _id: expenseId, userId: this.userId },
                {
                    amount,
                    category,
                    name
                },
                { new: true }
            )

            return updateUserExpense;

        } catch (error) {
            throw new ApiError(500, error.message)
        }

    }

    async getAndSaveRemainingBudget(expenseId) {
        try {
            const expense = await Expense.findOne({ _id: expenseId, userId: this.userId })

            const user = await Users.findByIdAndUpdate(
                this.userId,
                {
                    remainingBudget: this.remaingingBudget - expense.amount
                },
                { new: true }
            )
            return { updatedBudget: user.budget }
        } catch (error) {
            throw new ApiError(500, error.message)
        }

    }

    async delExpense(expenseId, ans) {
        try {


            const userAns =
                ["I added it by mistake",
                    "I paid, but got a refund",
                    "I paid and didn't get a refund"]

            const expense = await Expense.findOne({ _id: expenseId, userId: this.userId })
            if (!expense) {
                throw new ApiError(404, "Expense not found");
            }

            if (!userAns.includes(ans)) {
                throw new ApiError(400, "Invalid expense deletion ans")
            }

            await Expense.findOneAndUpdate(
                { _id: expenseId, userId: this.userId },
                {
                    deletionReason: ans
                },
                { new: true }
            )
            let newBudget;
            if (ans === userAns[0] || ans === userAns[1]) {
                newBudget = await Users.findByIdAndUpdate(this.userId, {
                    $inc: { remainingBudget: expense.amount }
                },
                    { new: true });

                await pushToHistory(Expense , this.userId, expense._id, "expenses")

            } else {
                await pushToHistory(Expense , this.userId, expense._id, "expenses")
            }



            return { newBudget, userAns: ans }
        } catch (err) {
            throw new ApiError(500, err.message)
        }
    }



}