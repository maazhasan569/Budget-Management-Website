import mongoose from "mongoose";
import { loanHistorySchema } from "./loan-schema";
import { goalsHistorySchema } from "./goal-schema";
import { expenseHistorySchema } from "./expense-schema";
import { taskHistorySchema } from "./task-schema";

const historySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Users"
    },
    expenses: [expenseHistorySchema],
    loans: [loanHistorySchema],
    goals: [goalsHistorySchema],
    tasks: [taskHistorySchema]
}, {
    timestamps: true
})
export const History = mongoose.model("History", historySchema)
