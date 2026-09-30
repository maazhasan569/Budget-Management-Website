import { Expense } from "../models/budget/expense.models"
import { Goal } from "../models/budget/goals.models"
import { Loan } from "../models/budget/loan.models"
import { Users } from "../models/users.models"
import ApiError from "../utils/ApiError"
class dashboardService {
    constructor(userId) {
        this.userId = userId
    }


    async financialScore() {
        const user = await Users.findById(this.userId)
        const loans = await Loan.find({ userId: this.userId })
        const goals = await Goal.find({ userId: this.userId })
        const spendingControl = 100 - ((user.budget / user.income - 0.70) /
            0.30 * 100)

        let totalLoanAmt;
        let totalLoanAmtPaid;
        for (const loan of loans) {
            totalLoanAmt += loan.loanTargetAmt
            totalLoanAmtPaid += loan.currentAmt
        }

        let totalGoalAmt;
        let totalGoalAmtPaid;
        for (const goal of goals) {
            totalGoalAmt += goal.targetAmount
            totalGoalAmtPaid += goal.currentAmt
        }

        const deptPaid = totalLoanAmtPaid / totalLoanAmt * 100
        const goalsFunded = totalGoalAmt / totalGoalAmt * 100

        return spendingControl + deptPaid + goalsFunded / 3

    }
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
        const goals = await Goal.find({ userId: this.userId, autoDeduction: false });
        const loans = await Loan.find({ userId: this.userId, autoDeduction: false });

        const buildAlert = (item) => {
            const lastIdx = item.deductionDates.length - 1;
            const lastDeductionDate = item.deductionDates[lastIdx];

            const now = new Date();
            const thisMonth = now.getMonth();
            const thisYear = now.getFullYear();


            if (lastDeductionDate && lastDeductionDate.getMonth() === thisMonth &&
                lastDeductionDate.getFullYear() === thisYear) {
                return null;
            }

            const dueDate = new Date(thisYear, thisMonth, item.deductionDay);
            const msPerDay = 1000 * 60 * 60 * 24;
            const daysUntilDue = Math.round((dueDate - now) / msPerDay);

            let dueDateAlert;
            if (daysUntilDue <= 3) dueDateAlert = "very close";
            else if (daysUntilDue <= 7) dueDateAlert = "close";
            else return null;

            return { dueDateAlert, daysUntilDue, item };
        };

        const goalAlerts = goals.map(buildAlert).filter(Boolean).map(a => ({ ...a, type: "goal" }));
        const loanAlerts = loans.map(buildAlert).filter(Boolean).map(a => ({ ...a, type: "loan" }));

        return [...goalAlerts, ...loanAlerts];
    }

    async getFlaggedDocs(){ // this will get overdue and no_fund status goal and loans
        const goals = await Goal.find({ userId: this.userId });
        const loans = await Loan.find({ userId: this.userId});

       const flaggedGoals = goals.filter(
        (goal) => goal.status === "unAchieved" || goal.status === "no_funds"
    );

       const flaggedLoans = loans.filter(
        (loan) => loan.status === "Overdue" || loan.status === "no_funds"
    );
        return {
            flaggedGoals,
            flaggedLoans,
        }
    }

    async spendingTrends() {
        const expenses = await Expense.find({ userId: this.userId }).sort({ createdAt: 1 });

        if (expenses.length === 0) {
            return { granularity: "day", data: [] };
        }

        const largestDate = expenses[expenses.length - 1].createdAt;
        const smallestDate = expenses[0].createdAt;

        const dateDiffDays = (largestDate - smallestDate) / (1000 * 60 * 60 * 24);

        let granularity;
        if (dateDiffDays <= 31) granularity = "day";
        else if (dateDiffDays <= 180) granularity = "week";
        else if (dateDiffDays <= 730) granularity = "month";
        else granularity = "year";

        const keyFor = (date) => {
            const d = new Date(date);
            if (granularity === "day") return d.toISOString().slice(0, 10); // 2026-09-21
            if (granularity === "week") {
                const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
                const week = Math.ceil(((d - firstDayOfYear) / 86400000 + firstDayOfYear.getDay() + 1) / 7);
                return `${d.getFullYear()}-W${week}`;
            }
            if (granularity === "month") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            return `${d.getFullYear()}`;
        };

        const grouped = {};
        for (const expense of expenses) {
            const key = keyFor(expense.createdAt);
            grouped[key] = (grouped[key] || 0) + expense.amount;
        }

        const data = Object.entries(grouped).map(([label, amount]) => ({ label, amount }));

        return { granularity, data };
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


        let categoryPercentages = {};
        let categoryTotals = {}
        let grandTotal;
        for (const expense of expenses) {
            categoryTotals[expense.category] =
                (categoryTotals[expense.category] || 0) + expense.amount;

            grandTotal += expense.amount;
        }

        for (const category in categoryTotals) {
            categoryPercentages[category] = Number(
                ((categoryTotals[category] / grandTotal) * 100).toFixed(2)
            );
        }

    }

}