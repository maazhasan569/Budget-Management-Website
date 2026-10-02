
import { Goal } from "../models/budget/goals.models.js";
import { Users } from "../models/users.models.js";
import ApiError from "../utils/ApiError.js";
import cron from "node-cron"
import pushToHistory from "../utils/pushToHistory.js";
export class GoalService {
    constructor(userId, config = {}) {
        this.userId = userId;
        this.name = config.name
        this.targetAmount = config.targetAmount
        this.targetDate = null
        this.frequency = config.frequency
        this.category = config.category
        this.duration = config.duration
        this.autoDeduction = config.autoDeduction
        this.goalBalance = 0
    }
    validateGoal() {
        const fieldCheck = [this.name, this.targetAmount, this.frequency, this.duration]
            .some((field) => {
                if (typeof field === 'string') {
                    return !field || field.trim() === ""
                }
                return !field
            })

        if (fieldCheck) {
            throw new ApiError(400, "Enter All fields")
        }

        if (this.targetAmount < 0) {
            throw new ApiError(400, "enter a valid targetAmt")
        }

    }
    async createGoal() {
        this.setTargetDate(this.duration, this.frequency)
        this.validateGoal()
        try {
            const newGoal = await Goal.create({
                userId: this.userId,
                goalName: this.name,
                achievementDate: this.targetDate,
                targetAmount: this.targetAmount,
                status: "in_progress",
                type: this.frequency,
                duration: this.duration,
                autoDeduction: this.autoDeduction,
                category: this.category,

            })
            return newGoal
        } catch (err) {
            throw new ApiError(500, err)
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
    getDeadlineTime(duration, frequency) {
        const now = new Date();
        this.setTargetDate(duration, frequency)
        const target = new Date(this.targetDate);

        const yearDiff = target.getFullYear() - now.getFullYear();
        const monthDiff = target.getMonth() - now.getMonth();

        const totalMonths = yearDiff * 12 + monthDiff;
        return totalMonths
    }
    async autoDeductAmount() {
        try {
            cron.schedule('0 0 * * *', async () => {
                const today = new Date()
                const autoDeductionGoals = await Goal.find({
                    autoDeduction: true,
                    userId: this.userId,
                    status: "in_progress"
                })
                for (const goal of autoDeductionGoals) {
                    this.targetAmount = goal.targetAmount
                    this.goalBalance = goal.currentAmt
                    this.duration = goal.duration
                    this.autoDeduction = goal.autoDeduction
                    this.frequency = goal.type
                    this.category = goal.category
                    this.name = goal.name
                    const lastIdx = goals.deductionDates.length - 1
                    if (today.getDate() === goal.deductionDay.getDate()) {
                        const lastMonth = goal.deductionDates[lastIdx]?.getMonth()
                        const thisMonth = today.getMonth()
                        if (lastMonth === thisMonth) continue;
                        if (goal.totalDeductions === this.duration) {
                            if(this.targetAmount === this.goalBalance) {
                            goal.status = "Achieved"
                            await goal.save()
                            await pushToHistory(this.userId, delGoal._id, "goals")
                            }
                            continue;
                        }

                        const user = await Users.findById(this.userId)
                        const income = user.income * 0.25
                        if (user.netIncome <= income) {
                            goal.status = "no_funds"
                            await goal.save()
                            continue;
                        }


                        const deadlineInMonths = this.getDeadlineTime(this.duration, this.frequency)
                        const deductAmt = (this.targetAmount - this.goalBalance) / deadlineInMonths
                        this.goalBalance += deductAmt
                        goal.currentAmt = this.goalBalance
                        user.netIncome -= deductAmt
                        goal.deductionDates.push(new Date())
                        goal.totalDeductions += 1
                        const orgDate = new Date(goal.createdAt).getDate()
                        const currentDay = new Date()
                        let targetMonth = currentDay.getMonth() + 1
                        let targetYear = currentDay.getFullYear()
                        const getTargetDate = new Date(targetYear, targetMonth + 1, 0).getDate();
                        const safeDay = Math.min(getTargetDate, orgDate)
                        goal.deductionDay = new Date(targetYear, targetMonth, safeDay)

                        const updatedGoal = await goal.save();
                        const updatedUser = await user.save()

                        return { updatedGoal, updatedUser }
                    }
                }
            })
        } catch (err) {
            throw new ApiError(500, err.message)
        }
    }
    async manualDeduction(amount, goalId) {
        try {
            const goal = await Goal.findOne({
                _id: goalId,
                userId: this.userId,
                autoDeduction: false,
                status: "in_progress"
            })
            if (!goal) {
                throw new ApiError(400, "Goal not found Or Deleted")
            }
            this.targetAmount = goal.targetAmount
            this.goalBalance = goal.currentAmt
            this.duration = goal.duration
            this.autoDeduction = goal.autoDeduction
            this.frequency = goal.type
            this.category = goal.category
            this.name = goal.name
            const lastIdx = goal.deductionDates.length - 1
            let deadlineInMonths = this.getDeadlineTime(this.duration, this.frequency)
            const lastMonth = goal.deductionDates[lastIdx]?.getMonth()
            const thisMonth = new Date().getMonth()
            if (lastMonth === thisMonth) throw new ApiError(400, "Goal monthly amt already paid")
             if (this.targetAmount === 0 && deadlineInMonths !== 0) {
                deadlineInMonths = 0
            }
            // as soon as user payes his monthly goal check whether the cond passes
            if (goal.totalDeductions + 1 > deadlineInMonths || goal.totalDeductions + 1 === this.duration) {
                if(this.targetAmount !== this.goalBalance) throw new ApiError(400 , "Loan overdued")
                
                goal.status = "Achieved"
                const updatedGoal = await goal.save()
                await pushToHistory(this.userId, delGoal._id, "goals")
                return { updatedGoal, pushedToHistory: true }
                // if passed automaticly push the goal to history
            }
            if (!amount || amount < 0) {
                throw new ApiError(400, "Enter a valid amount")
            }
            if (amount > this.targetAmount) {
                throw new ApiError(400, "Amount cant be more than targetAmt")
            }
            const user = await Users.findById(this.userId)
            if (amount > user.netIncome) {
                throw new ApiError(400, "Amount to large . netIncome not enough")
            }
            const income = user.income * 0.25
            if (user.netIncome <= income) {
                goal.status = "no_funds"
                const saveGoal = await goal.save()
                return saveGoal
            }

            this.goalBalance += amount
            goal.currentAmt = this.goalBalance
            goal.deductionDates.push(new Date())
            goal.totalDeductions += 1
            user.netIncome -= amount

           
            const updatedGoal = await goal.save()
            const updatedUser = await user.save()

            return { updatedGoal, updatedUser, pushedToHistory: false }
        } catch (err) {
            throw new ApiError(500, err.message)
        }



    }

    async editGoal(goalId) {
        try {
            if (!goalId) {
                throw new ApiError(400, "No goal id found")
            }
            this.setTargetDate(duration, frequency)
            this.validateGoal()
            const updatedGoal = await Goal.findOneAndUpdate(
                {
                    _id: goalId,
                    userId: this.userId,
                },
                {
                    goalName: this.name,
                    achievmentDate: this.targetDate,
                    targetAmount: this.targetAmount,
                    autoDeduction: this.autoDeduction,
                    type: this.frequency,
                    duration: this.duration,
                    category: this.category
                },
                { new: true }
            )
            return updatedGoal
        } catch (err) {
            throw new ApiError(500, err.message)
        }
    }
    async deleteGoal(goalId) {
        if (!goalId) {
            throw new ApiError(400, "No goal id found")
        }
        try {
            //find and update the goal status
            //add goal balance to income
            //delete the goal 
            //add the deleted goal to history
            const updateGoal = await Goal.findOneAndUpdate(
                { _id: goalId },
                {
                    $set: { status: "Abandoned" }
                },
                { returnDocument: 'after' }
            );
            if (!updateGoal) return null
            const deletedGoal = await Goal.findByIdAndDelete(goalId)
            const history = await pushToHistory(this.userId, deletedGoal._id, "goals")
            const user = await Users.findById(this.userId)
            user.netIncome += updateGoal.currentAmt
            const updatedUser = await user.save()
            const updatedUserNetIncome = updatedUser.netIncome
            return { updatedUserNetIncome, deletedGoal, history }


        } catch (err) {
            throw new ApiError(500, err.message)
        }
    }
    async AmtPaid() {
        try {
            const userGoals = await Goal.find({ userId: this.userId })
            if (!userGoals) return 0
            const totalPaid = userGoals.reduce((sum, goal) => sum + goal.currentAmt, 0)
            return totalPaid
        } catch (err) {
            throw new ApiError(500, err.message)
        }
    }
    async AmtRemaining() {
        try {
            const userGoals = await Goal.find({ userId: this.userId })
            if (!userGoals) return 0
            const goalAmtRemaining = userGoals.reduce((sum, goal) => sum + goal.targetAmount, 0)
            return goalAmtRemaining
        } catch (err) {
            throw new ApiError(500, err.msg)
        }
    }

    async setUnachievedStatus() {
        try {

                const goals = await Goal.find(this.userId)
                for (const goal of goals) {
                    if (goal.totalDeductions === this.duration) {
                       if(this.targetAmount !== 0) goal.status = "UnAchieved"
                        const updatedGoal = await goal.save()
                        return updatedGoal
                    }

                }
        }catch(err){
            throw new ApiError(500 , err.message)
        }
    }

}



