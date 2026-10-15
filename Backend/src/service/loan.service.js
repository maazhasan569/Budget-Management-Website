import { Loan } from "../models/budget/loan.models.js"
import ApiError from "../utils/ApiError.js"
import { Users } from "../models/users.models.js"
import cron from "node-cron"
import { isValidObjectId } from "mongoose"
import pushToHistory from "../utils/pushToHistory.js"
import { convertToSnakeCase } from "../utils/convertToSnakeCase.js"
import { History } from "../models/history.models.js"
export class LoanService {
    constructor(userId, config = {}) {
        this.userId = userId,
            this.name = config.name,
            this.loanTargetAmt = config.loanTargetAmt,
            this.targetDate = null,
            this.frequency = config.loanType,
            this.category = config.category,
            this.duration = config.duration,
            this.autoDeduction = config.autoDeduction,
            this.totalPaid = 0
    }

    validateLoan() {
        const fieldCheck = [this.name, this.loanTargetAmt, this.frequency, this.duration]
            .some((field) => {
                if (typeof field === 'string') {
                    return !field || field.trim() === ""
                }
                if (!field) return !field
            })

        if (fieldCheck) {
            throw new ApiError(400, "Enter All fields")
        }

        if (this.loanTargetAmt <= 0) {
            throw new ApiError(400, "Enter a Valid amt")
        }

        if (this.duration <= 0) {
            throw new ApiError(400, "Enter a Valid duration")
        }
    }

    async createLoan() {

        this.setTargetDate(this.duration, this.frequency)
        this.validateLoan()
        try {
            const currentDay = new Date()
            let targetMonth = currentDay.getMonth() + 1
            let targetYear = currentDay.getFullYear()
            const daysInNextMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
            const deductionDay = new Date(targetYear, targetMonth, daysInNextMonth)


            console.log(this.userId)
            const newLoan = await Loan.create({
                userId: this.userId,
                loanName: this.name,
                loanTargetAmt: this.loanTargetAmt,
                currentAmt: this.totalPaid,
                dueDate: this.targetDate,
                duration: this.duration,
                loanType: this.frequency,
                autoDeduction: this.autoDeduction,
                category: this.category,
                status: "in_progress",
                deductionDay,
            })
            const updateUserBankbalance = await Users.findByIdAndUpdate(
                this.userId,
                { $inc: { bankBalance: this.loanTargetAmt } },
                { returnDocument: 'after' }
            )
            return { newLoan, updateUserBankbalance }
        } catch (err) {
            throw new ApiError(500, err.message)
        }
    }

    setTargetDate(duration, frequency) {
        const date = new Date()
        if (frequency === "Yearly") {
            this.duration = duration * 12
        }
        date.setMonth(date.getMonth() + this.duration)
        date.setHours(0, 0, 0, 0)
        this.targetDate = date
    }
    // getDeadlineTime(duration, frequency) {
    //     const now = new Date();
    //     this.setTargetDate(duration, frequency)
    //     const target = new Date(this.targetDate);

    //     const yearDiff = target.getFullYear() - now.getFullYear();
    //     const monthDiff = target.getMonth() - now.getMonth();

    //     const totalMonths = yearDiff * 12 + monthDiff;
    //     return totalMonths
    // }
    async editLoan(loanId) {
        try {
            if (!loanId) {
                throw new ApiError(400, "No loan if found")
            }

            if (!isValidObjectId(loanId)) {
                throw new ApiError(400, "id not valid")
            }
            this.setTargetDate(this.duration, this.frequency)
            this.validateLoan()

            const updateLoan = await Loan.findOneAndUpdate(
                {
                    _id: loanId,
                    userId: this.userId
                },
                {
                    loanName: this.name,
                    loanTargetAmt: this.loanTargetAmt,
                    duration: this.duration,
                    dueDate: this.targetDate,
                    loanType: this.frequency,
                    autoDeduction: this.autoDeduction,
                    category: this.category
                },
                { returnDocument: "after" }
            );

            if (!updateLoan) {
                throw new ApiError(400, "User loan not found")
            }
            return updateLoan;
        } catch (err) {
            throw new ApiError(400, err.message)
        }
    }
    async amtPaid() {
        try {
            const userLoans = await Loan.find({ userId: this.userId })
            const userHistoryData = await History.findOne({ userId: this.userId })

            let histroyLoanAmt = 0
            if (userHistoryData?.loans) {
                if (userHistoryData.loans.length > 0) {
                    for (let i = 0; i < userHistoryData.loans.length; i++) {
                        const loandoc = userHistoryData.loans[i]
                        histroyLoanAmt += loandoc.currentAmt || 0
                    }
                }
            }
            const totalPaid = userLoans.reduce((sum, loan) => sum + (loan.currentAmt || 0), 0)
            return totalPaid + histroyLoanAmt
        } catch (err) {
            throw new ApiError(500, err.message)
        }
    }
    async amtRemaining() {
        try {
            const userLoans = await Loan.find({ userId: this.userId })
            if (!userLoans) return 0
          
            const loansAmtRemaining = userLoans.reduce(
                (sum, loan) =>
                    sum + Math.max(0, Number(loan.loanTargetAmt) - Number(loan.currentAmt)),
                0
            );
            return loansAmtRemaining
        } catch (err) {
            throw new ApiError(500, err.msg)
        }
    }
    async autoDeductAmt() {
        try {

            const autoDeductionTasks = new Map();
            const userId = this.userId;
            const taskKey = String(userId);
            const query = {
                autoDeduction: true,
                userId,
                status: "in_progress",
            };

            const hasAutoLoans = await Loan.exists(query);
            const existingTask = autoDeductionTasks.get(taskKey);

            if (!hasAutoLoans) {
                if (existingTask) {
                    existingTask.stop();
                    existingTask.destroy();
                    autoDeductionTasks.delete(taskKey);
                }

                return { autodeductionLoan: false };
            }

            if (existingTask) {
                return { autodeductionLoan: true, alreadyScheduled: true };
            }

            const task = cron.schedule("0 0 * * *", async () => {
                // Fetch current loan documents on every scheduled run.
                const latestLoans = await Loan.find(query);

                if (!latestLoans.length) {
                    task.stop();
                    task.destroy();
                    autoDeductionTasks.delete(taskKey);
                    return;
                }

                await this.processAutoLoans(latestLoans);

                const stillHasAutoLoans = await Loan.exists(query);
                if (!stillHasAutoLoans) {
                    task.stop();
                    task.destroy();
                    autoDeductionTasks.delete(taskKey);
                }
            });

            autoDeductionTasks.set(taskKey, task);

            return { autodeductionLoan: true, alreadyScheduled: false };
        } catch (err) {
            throw new ApiError(400, err.message);
        }
    }

    async processAutoLoans(autoDeductionLoans) {
        const today = new Date();

        for (const loan of autoDeductionLoans) {
            this.loanTargetAmt = loan.loanTargetAmt;
            this.totalPaid = loan.currentAmt;
            this.duration = loan.duration;
            this.autoDeductAmt = loan.autoDeduction;
            this.frequency = loan.loanType;
            this.category = loan.category;
            this.name = loan.name;

            const lastdeductionidx = loan.deductionDates.length - 1;

            if (today.getDate() === loan.deductionDay.getDate()) {
                const lastMonth = loan.deductionDates[lastdeductionidx]?.getMonth();
                const thisMonth = today.getMonth();

                if (lastMonth === thisMonth) continue;

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dueDate = new Date(loan.dueDate);
                dueDate.setHours(0, 0, 0, 0);
                if (today > dueDate && this.loanTargetAmt !== this.totalPaid) continue;


                    if (this.loanTargetAmt === this.totalPaid) {
                        loan.status = "Completed";
                        const savedLoan = await loan.save();
                        await pushToHistory(
                            Loan,
                            this.userId,
                            savedLoan._id,
                            "loans"
                        );
                        continue;
                    }

                    
                

                const user = await Users.findByIdAndUpdate(this.userId);
                const income = user.income * 0.25;

                if (user.netIncome <= income) {
                    loan.status = "no_funds";
                    await loan.save();
                    continue;
                }

                const deadlineInMonths = this.duration;
                const deductAmt =
                    (this.loanTargetAmt - this.totalPaid) / deadlineInMonths;

                this.totalPaid += deductAmt;
                loan.currentAmt = this.totalPaid;
                user.netIncome -= deductAmt;
                loan.deductionDates.push(new Date());
                loan.totalDeductions += 1;

                const orgDate = new Date(loan.createdAt).getDate();
                const currentDay = new Date();
                let targetMonth = currentDay.getMonth() + 1;
                let targetYear = currentDay.getFullYear();
                const daysInNextMonth =
                    new Date(targetYear, targetMonth + 1, 0).getDate();
                const safeDay = Math.min(daysInNextMonth, orgDate);

                loan.deductionDay = new Date(targetYear, targetMonth, safeDay);

                const updatedLoan = await loan.save();
                const updatedUser = await user.save();

                return { updatedLoan, updatedUser };
            }
        }
    }
    async manualDeduction(amount, loanId) {
        if (!loanId) {
            throw new ApiError(400, "loan id is required")
        }
        if (!isValidObjectId(loanId)) {
            throw new ApiError(400, "Invalid loanid")
        }

        try {
            const loan = await Loan.findOne({
                _id: loanId,
                userId: this.userId,
                autoDeduction: false,
                status: "in_progress"
            })

            if (!loan) {
                throw new ApiError(400, "loan not found. this could be an autodeduction goal")
            }
            this.loanTargetAmt = loan.loanTargetAmt
            this.totalPaid = loan.currentAmt
            this.duration = loan.duration
            this.autoDeduction = loan.autoDeduction
            this.frequency = loan.loanType
            this.category = loan.category
            this.name = loan.name

            const lastDeductionIdx = loan.deductionDates.length - 1
            const lastMonth = loan.deductionDates[lastDeductionIdx]?.getMonth()
            const thisMonth = new Date().getMonth()
            if (lastMonth === thisMonth) throw new ApiError(400, "Loan monthly amt already paid")



            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dueDate = new Date(loan.dueDate);
            dueDate.setHours(0, 0, 0, 0);

            if (today > loan.dueDate && this.loanTargetAmt !== this.totalPaid) {
                throw new ApiError(400, "Loan is overDued")
            }

            if (this.loanTargetAmt === this.totalPaid) {
                loan.status = "Completed"
                const updatedLoan = await loan.save()
                await pushToHistory(Loan, this.userId, updatedLoan._id, "loans")
                return { updatedLoan, pushToHistory: true }
            }
            if (!amount || amount < 0) {
                throw new ApiError(400, "Enter not given or Invalid amount")
            }

            if (amount > this.loanTargetAmt - loan.currentAmt) {
                throw new ApiError(400, "Amount cant be more than targetAmt")
            }

            const user = await Users.findById(this.userId)
            if (amount > user.netIncome) {
                throw new ApiError(400, "Amount to large . netIncome not enough")
            }

            const income = user.income * 0.25
            if (user.netIncome <= income) {
                loan.status = "no_funds"
                const saveloan = await loan.save()
                return saveloan
            }


            this.totalPaid += amount
            loan.currentAmt = this.totalPaid
            loan.deductionDates.push(new Date())
            loan.totalDeductions += 1
            user.netIncome -= amount


            const updatedLoan = await loan.save()
            const updatedUser = await user.save()
            return { updatedLoan, updatedUser, pushedToHistory: false }
        } catch (err) {
            throw new ApiError(500, err.message)
        }

    }

    async pauseLoan(loanId, undoAlertOrUnBlockLoan = false) {
        //get the lastdeduction array
        //loop over each element
        //check if there a time of the month where user hasnot paid for 3 or more months
        //if yes set consecutive = true
        //if not give a normal alert 
        //also return no. of consecutive miss deduction

        let consecutive = false
        let totalMissedDeductions;

        const loan = await Loan.findById(loanId)

        if (undoAlertOrUnBlockLoan) {
            if (loan.status === "Paused") loan.status = "in_progress"
            return
        }

        const dates = loan.deductionDates
        loan.deductionDates.forEach((elem, idx) => {
            const prevDeduction = dates[idx].getMonth()
            const nextDeduction = dates[idx + 1].getMonth()
            const monthsDiff = nextDeduction - prevDeduction

            if (monthsDiff >= 3) {
                loan.status = "Paused"
                totalMissedDeductions = monthsDiff
                consecutive = true

            } else if (monthsDiff > 1 && monthsDiff < 3) {
                loan.status = "Paused"
                totalMissedDeductions = monthsDiff
                consecutive = false

            }
        })

        await loan.save()

        return { totalMissedDeductions, consecutive }

        //alert feature will be added in the next version 1.1
        //loan model will have seperate alert field containing an alert msg of the loan


    }
    async deleteLoan(loanId, deletionReason) {

        if (!loanId) {
            throw new ApiError(400, "No loan id found")
        }

        try {
            if (!isValidObjectId(loanId)) {
                throw new ApiError(400, "Invalid mongoose objId")
            }
            const loan = await Loan.findOne({ _id: loanId, userId: this.userId })
            if (!loan) {
                throw new ApiError(400, "Loan not found")
            }
            const userReason = convertToSnakeCase(deletionReason) // loan deletion reason from user
            const validReasons = [
                "created_by_mistake",
                "no_longer_needed",
                "found_alternative",
                "personal_reason",
                "other"
            ]


            if (!validReasons.includes(userReason)) {
                throw new ApiError(400, "Invalid loan deletion reason")
            }

            const updatedUserBankBalance = await Users.findByIdAndUpdate(
                this.userId,
                {
                    $inc: { bankBalance: loan.currentAmt }
                }
            )
            const updatedLoan = await Loan.findOneAndUpdate(
                { userId: this.userId, _id: loanId },
                {
                    deletionReason: userReason
                }
            )
            const history = await pushToHistory(Loan, this.userId, loanId, "loans")
            return { history, updatedUserBankBalance }
        } catch (err) {
            throw new ApiError(400, err.message)
        }
    }

    async setOverdueStatus() {
        try {


            const loans = await Loan.find({ userId: this.userId })
            for (const loan of loans) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dueDate = new Date(loan.dueDate);
                dueDate.setHours(0, 0, 0, 0);
                if (today > dueDate) {
                    if (loan.currentAmt < loan.loanTargetAmt) {
                        loan.status = "Overdue"
                        const updatedLoan = await loan.save()
                        return updatedLoan
                    }

                }
            }
        } catch (err) {
            throw new ApiError(500, err.message)
        }
    }
}