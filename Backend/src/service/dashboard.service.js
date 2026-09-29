import { Goal } from "../models/budget/goals.models"
import { Loan } from "../models/budget/loan.models"
class dashboardService{
    constructor(userId){
        this.userId = userId
    }

    
    financialScore(){}
    async goalProgress(goalId){
        //get goals
        //perform arithematic calc
        //to convert goal progress in percentage
        //return all goals 
        const goals = await Goal.find({userId : this.userId})
        goals.map((goal) => {
            const progressPercent = goal.currentAmt/goal.targetAmount * 100
            return {
                goal,
                progressPercent
            }
        })
    }
   async loanProgress(loanId){
        //same as goal progress
        const loans = await Loan.find({userId : this.userId})
        loans.map((loan) => {
            const progressPercent = loan.currentAmt/loan.loanTargetAmt * 100
            return {
                loan,
                progressPercent
            }
        })
    }
    alertUserForUpcomingGoalAndLoan(id){
        //get loan and goal
        //filter out loan and goal
        //filter those which due date is close
        //choose a x% to check if the due date is close
        //there will be 2 stages close and very close
        //close will be refered with yellow and very close with red

        const goals = Goal.find({userId : this.userId , manualDeduction})
        goals.map((goal) => {
            let deduction;
            const lastIdx = goals.deductionDates.length - 1
            
            const lastMonth = goal.deductionDates[lastIdx]?.getMonth()
            const thisMonth = new Date().getMonth()
            if (lastMonth === thisMonth) return
            
            if(goals.deductionDates.length){
                const lastIdx = goals.deductionDates.length - 1
                deduction = goals.deductionDates[lastIdx] - goal.deductionDay
            }

            deduction = goal.createdAt - goal.deductionDay

            const dueDatePercentage = deduction/30 * 100

            let dueDatealert;
            if(dueDatePercentage <= 10) return dueDatealert = "very close"
            if(dueDatePercentage <= 20) return dueDatealert = "close"

            return {
                dueDatealert,
                goal
            }
        })
    }
    expenseAndIncome(){
    }
    expenseCategoryPercentages(){
        //get expense doc
        //fetch each category
        //calc percentage for each category
        //e.g Car is a category it includes the most expenses
        //it would have the highest percentage
    }

}