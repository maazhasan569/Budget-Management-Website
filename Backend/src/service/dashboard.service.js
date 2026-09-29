import { Expense } from "../models/budget/expense.models"
import { Goal } from "../models/budget/goals.models"
import { Loan } from "../models/budget/loan.models"
import ApiError from "../utils/ApiError"
class dashboardService {
    constructor(userId) {
        this.userId = userId
    }


    financialScore() { }
    async goalProgress(goalId) {
        //get goals
        //perform arithematic calc
        //to convert goal progress in percentage
        //return all goals 
        const goals = await Goal.find({ userId: this.userId })
        goals.map((goal) => {
            const progressPercent = goal.currentAmt / goal.targetAmount * 100
            return {
                goal,
                progressPercent
            }
        })
    }
    async loanProgress(loanId) {
        //same as goal progress
        const loans = await Loan.find({ userId: this.userId })
        loans.map((loan) => {
            const progressPercent = loan.currentAmt / loan.loanTargetAmt * 100
            return {
                loan,
                progressPercent
            }
        })
    }
    async alertUserForUpcomingGoalAndLoan(id) {
        //get loan and goal
        //filter out loan and goal
        //filter those which due date is close
        //choose a x% to check if the due date is close
        //there will be 2 stages close and very close
        //close will be refered with yellow and very close with red

        const goals = await Goal.find({ userId: this.userId, manualDeduction })
        goals.map((goal) => {
            let deduction;
            const lastIdx = goal.deductionDates.length - 1

            const lastMonth = goal.deductionDates[lastIdx]?.getMonth()
            const thisMonth = new Date().getMonth()
            if (lastMonth === thisMonth) return

            if (goals.deductionDates.length) {
                deduction = goal.deductionDates[lastIdx] - goal.deductionDay
            } else {
                deduction = goal.createdAt - goal.deductionDay

            }

            const dueDatePercentage = deduction / 30 * 100

            let dueDatealert;
            if (dueDatePercentage <= 10) dueDatealert = "very close"
            if (dueDatePercentage <= 20) dueDatealert = "close"

            return {
                dueDatealert,
                goal
            }
        })
    }
    expenseAndIncome() {
    }
    async expenseCategoryPercentages() {
        //get expense doc
        //fetch each category
        //calc percentage for each category
        //e.g Car is a category it includes the most expenses
        //it would have the highest percentage

        const expenses = await Expense.find({ userId: this.userId })

        if (!expenses.length) {
            throw new ApiError(400, "No expense found")
        }


        for (const expense of expenses) {
            categoryTotals[expense.category] =
                (categoryTotals[expense.category] || 0) + expense.amount;

            grandTotal += expense.amount;
        }

        const categoryPercentages = {};

        for (const category in categoryTotals) {
            categoryPercentages[category] = Number(
                ((categoryTotals[category] / grandTotal) * 100).toFixed(2)
            );
        }

    }

}