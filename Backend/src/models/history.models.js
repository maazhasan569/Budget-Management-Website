import mongoose from "mongoose";


const loanHistorySchema = new mongoose.Schema({
  loanId: { type: mongoose.Schema.Types.ObjectId, ref: "Loan" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
  loanName: String,
  category: { type: String, default: "General" },
  loanType: { type: String, enum: ["Monthly", "Yearly"] },
  status: {
    type: String,
    enum: ["in_progress", "Overdue", "Completed", "Cancelled", "Paused", "no_funds"],
  },
  alert: String,
  loanTargetAmt: { type: Number, required: true },
  currentAmt: { type: Number, required: true },
  dueDate: Date,
  duration: Number,
  autoDeduction: { type: Boolean, default: false },
  totalDeductions: { type: Number, default: 0 },
  deductionDates: [Date],
  deductionDay: Date,
  deletionReason: String,
}, { _id: false })

const historySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,  
        required: true,
        ref: "Users"
    },
    routine : [{
        type : mongoose.Schema.Types.ObjectId, //get all routines 
        ref : "Routine"
    }],
    expenses : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : "Expense", //add this in history after month end
    }],
    loans : [loanHistorySchema],
    goals : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : "Goal"
    }],
    tasks : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : "Task"
    }]
}, {
    timestamps: true
})
export const History = mongoose.model("History", historySchema)
