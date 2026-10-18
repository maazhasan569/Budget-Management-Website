import mongoose from "mongoose";
export const expenseHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref : "Users",
        required: true
    },
    amount : {
        type : Number,
        required : true,
    },
    category : {
        type : String,
        required : true,
        default : "General"
    },
    name : {
        type : String,
        required : true,
    },
    deletionReason : {
        type : String,
    }
})