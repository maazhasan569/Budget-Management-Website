
import { Goal } from "../models/budget/goals.models.js";
import { Users } from "../models/users.models.js";
import ApiError from "../utils/ApiError.js";
import cron from "node-cron"
import pushToHistory from "../utils/pushToHistory.js";
import { History } from "../models/history.models.js";



const autoDeductionTasks = new Map();

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
            const currentDay = new Date()
            let targetMonth = currentDay.getMonth() + 1
            let targetYear = currentDay.getFullYear()
            const daysInNextMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
            const deductionDay = new Date(targetYear, targetMonth, daysInNextMonth)
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
                deductionDay,

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


    async autoDeductAmt() {
        try {

            const userId = this.userId;
            const taskKey = String(userId);
            const query = {
                autoDeduction: true,
                userId,
                status: "in_progress",
            };

            const hasAutoGoals = await Goal.exists(query);
            const existingTask = autoDeductionTasks.get(taskKey);

            if (!hasAutoGoals) {
                if (existingTask) {
                    existingTask.stop();
                    existingTask.destroy();
                    autoDeductionTasks.delete(taskKey);
                }

                return { autodeductionGoal: false };
            }

            if (existingTask) {
                return { autodeductionGoal: true, alreadyScheduled: true };
            }

            const task = cron.schedule("0 0 * * *", async () => {
                // Fetch current loan documents on every scheduled run.
                const latestGoals = await Goal.find(query);

                if (!latestGoals.length) {
                    task.stop();
                    task.destroy();
                    autoDeductionTasks.delete(taskKey);
                    return;
                }

                await this.processAutoGoals(latestGoals);

                const stillHasAutoGoals = await Goal.exists(query);
                if (!stillHasAutoGoals) {
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

    async processAutoGoals(autoDeductionGoals) {
        const today = new Date();

        for (const goal of autoDeductionGoals) {

            this.targetAmount = goal.targetAmount
            this.goalBalance = goal.currentAmt
            this.duration = goal.duration
            this.autoDeduction = goal.autoDeduction
            this.frequency = goal.type
            this.category = goal.category
            this.name = goal.name
            const lastIdx = goal.deductionDates.length - 1
            if (today.getDate() === goal.deductionDay.getDate()) {
                const lastMonth = goal.deductionDates[lastIdx]?.getMonth()
                const thisMonth = today.getMonth()
                if (lastMonth === thisMonth) continue;

                const currentDate = new Date();
                today.setHours(0, 0, 0, 0);
                const dueDate = new Date(goal.achievementDate);
                dueDate.setHours(0, 0, 0, 0);
                if (currentDate > dueDate && this.targetAmount !== this.goalBalance) continue;

                if (this.targetAmount === this.goalBalance) {
                    goal.status = "Achieved";
                    const savedGoal = await goal.save();

                    await pushToHistory(
                        Goal,
                        this.userId,
                        savedGoal._id,
                        "goals"
                    );
                    continue;
                }

                const user = await Users.findById(this.userId)
                const income = user.income * 0.25
                if (user.netIncome <= income) {
                    goal.status = "no_funds"
                    await goal.save()
                    continue;
                }



                const deductAmt = (this.targetAmount - this.goalBalance) / this.duration
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
            const lastMonth = goal.deductionDates[lastIdx]?.getMonth()
            const thisMonth = new Date().getMonth()
            if (lastMonth === thisMonth) throw new ApiError(400, "Goal monthly amt already paid")

            const currentDate = new Date();
            const dueDate = new Date(goal.achievementDate);
            dueDate.setHours(0, 0, 0, 0);

            if (currentDate > dueDate && this.goalBalance != this.targetAmount) throw new ApiError(400, "Loan overdued")

            if (this.targetAmount === this.goalBalance) {
                goal.status = "Achieved"
                const updatedGoal = await goal.save()
                await pushToHistory(Goal, this.userId, updatedGoal._id, "goals")
                return { updatedGoal, pushedToHistory: true }

            }
            if (!amount || amount < 0) {
                throw new ApiError(400, "Enter a valid amount")
            }
            if (amount > this.targetAmount - this.goalBalance) {
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
            this.setTargetDate(this.duration, this.frequency)
            this.validateGoal()
            const updatedGoal = await Goal.findOneAndUpdate(
                {
                    _id: goalId,
                    userId: this.userId,
                },
                {
                    goalName: this.name,
                    achievementDate: this.targetDate,
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
                { _id: goalId , userId : this.userId },
                {
                    $set: { status: "Abandoned" }
                },
                { returnDocument: 'after' }
            );

            if(!updateGoal) return null
            const history = await pushToHistory(Goal , this.userId, updateGoal._id, "goals")
            const user = await Users.findById(this.userId)
            user.netIncome += updateGoal.currentAmt
            const updatedUser = await user.save()
            const updatedUserNetIncome = updatedUser.netIncome
            return { updatedUserNetIncome, deletedGoal : updateGoal, history }


        } catch (err) {
            throw new ApiError(500, err.message)
        }
    }
    async AmtPaid() {
        try {
            const userGoals = await Goal.find({ userId: this.userId })
            const userHistoryData = await History.findOne({ userId: this.userId })
            let histroyGoalAmt = 0
            if (userHistoryData?.goals) {
                if (userHistoryData.goals.length > 0) {
                    for (let i = 0; i < userHistoryData.goals.length; i++) {
                        const goaldoc = userHistoryData.goals[i]
                        histroyGoalAmt += goaldoc.currentAmt || 0
                    }
                }
            }
            const totalPaid = userGoals.reduce((sum, goal) => sum + goal.currentAmt || 0, 0)
            return totalPaid + histroyGoalAmt
        } catch (err) {
            throw new ApiError(500, err.message)
        }
    }
    async AmtRemaining() {
        try {
            const userGoals = await Goal.find({ userId: this.userId })
            if (!userGoals) return 0

            const GoalsAmtRemaining = userGoals.reduce(
                (sum, goal) =>
                    sum + Math.max(0, Number(goal.targetAmount) - Number(goal.currentAmt)),
                0
            );
            return GoalsAmtRemaining
        } catch (err) {
            throw new ApiError(500, err.msg)
        }
    }

    async setUnachievedStatus() {
        try {
            const today = new Date()
            const goals = await Goal.find({ userId: this.userId })
            if(!goals) return null
            for (const goal of goals) {
                const currentDate = new Date();
                today.setHours(0, 0, 0, 0);
                const dueDate = new Date(goal.achievementDate);
                dueDate.setHours(0, 0, 0, 0);
                if (currentDate > dueDate) {
                    if (goal.currentAmt < goal.targetAmount) goal.status = "unAchieved"
                    await goal.save()
                }
                
                
            }
        } catch (err) {
            throw new ApiError(500, err.message)
        }
    }

}



