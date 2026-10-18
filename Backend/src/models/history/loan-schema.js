export const loanHistorySchema = new mongoose.Schema({
    loanId: { type: mongoose.Schema.Types.ObjectId, ref: "Loan" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
    loanName: String,
    category: { type: String, default: "General" },
    loanType: { type: String, enum: ["Monthly", "Yearly"] },
    status: {
        type: String,
        enum: ["in_progress", "Overdue", "Completed", "Cancelled", "Paused", "no_funds"],
    },
})