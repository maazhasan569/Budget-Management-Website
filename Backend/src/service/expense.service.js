import ApiError from "../utils/ApiError.js"
import { Expense } from "../models/budget/expense.models.js"
import { Users } from "../models/users.models.js"
import { paginate } from "../utils/pagination.js"
import { History } from "../models/history.models.js"
export class ExpenseTracker {
    constructor(budget, userId) {
        if (!budget || budget <= 0) {
            throw new ApiError(400, `Invalid budget :${budget}`)
        }
        if (!userId) {
            throw new ApiError(400, "No user Id")
        }
        this.remaingingBudget = budget ,
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
            const updateUserExpense = await Expense.findByIdAndUpdate(
                expenseId,
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
    
    async getAndSaveRemainingBudget(id) {
        try {
            const expense = await Expense.findById(id)
            console.log('expense found' , expense)
            const user = await Users.findByIdAndUpdate(
                this.userId,
                {
                    budget: this.remaingingBudget - expense.amount
                },
                { new: true }
            )
            return { updatedBudget: user.budget}
        } catch (error) {
            throw new ApiError(500, error.message)
        }

    }

    async delExpense(expenseId, ans1, ans2) {
        try{
        if (ans1 === "No" && !ans2) {
            ans2 = "No";
        }

        const validAnswers = ["Yes", "No"];
        if (!validAnswers.includes(ans1) || !validAnswers.includes(ans2)) {
            throw new ApiError(400, "Answers must be 'Yes' or 'No'");
        }

        const expense = await Expense.findById(expenseId);
        if (!expense) {
            throw new ApiError(404, "Expense not found");
        }
        const DELETION_RULES = {
            "No_No": { action: "HARD_DELETE", restoreBudget: true },
            "No_Yes": { action: "HARD_DELETE", restoreBudget: true },
            "Yes_Yes": { action: "STORE_HISTORY", restoreBudget: true },
            "Yes_No": { action: "STORE_HISTORY", restoreBudget: false }
        };

        const rule = DELETION_RULES[`${ans1}_${ans2}`];
        let newBudget = null
        if (rule.restoreBudget) {
            newBudget = await Users.findByIdAndUpdate(this.userId, {
                $inc: { budget: expense.amount }
            },
                { new: true });
        }


        if (rule.action === "HARD_DELETE") {
            await Expense.findByIdAndDelete(expenseId);
            return { message: "Expense permanently deleted", restoredBudget: rule.restoreBudget, newBudget };
        } else {
            
            await History.create({ expenses: expenseId, userId: this.userId });
            console.log('pushed to history' , {hllk: 31})
            await Expense.findByIdAndDelete(expenseId);
            return { message: "Expense archived to history", restoredBudget: rule.restoreBudget, newBudget };
        }
    }catch(err){
        throw new ApiError(500 , err.message)
    }
    }



}