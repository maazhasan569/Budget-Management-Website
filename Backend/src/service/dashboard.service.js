class dashboardService{
    constructor(userId){
        this.userId = userId
    }

    savings(){}
    financialScore(){}
    goalProgress(goalId){
        //get goals
        //perform arithematic calc
        //to convert goal progress in percentage
        //return all goals 
    }
    loanProgress(loanId){
        //same as goal progress
    }
    alertUserForUpcomingGoalAndLoan(id){
        //get loan and goal
        //filter out loan and goal
        //filter those which due date is close
        //choose a x% to check if the due date is close
        //there will be 2 stages close and very close
        //close will be refered with yellow and very close with red
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