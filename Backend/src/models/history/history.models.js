import mongoose from "mongoose";
import { loanHistorySchema } from "./loan-schema.js";
import { goalsHistorySchema } from "./goal-schema.js";
import { expenseHistorySchema } from "./expense-schema.js";
import { taskHistorySchema } from "./task-schema.js";

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
