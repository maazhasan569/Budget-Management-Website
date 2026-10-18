import mongoose from "mongoose"

export const loanHistorySchema = new mongoose.Schema({

    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Users"
    },
    loanName :{
        type : String,
    },
    category : {
        type : String,
        default : "General"
    },
    loanType : {
        type : String,
        enum : ["Monthly" , "Yearly"]
    },
    status : {
        type : String,
        enum : ["in_progress" , "Overdue" , "Completed" , "Cancelled" , "Paused" , "no_funds"]
    },//add status for deleting the loan 
    alert : {
        type : String,
    },
    loanTargetAmt : {
        type : Number,
        required : true
    },
    currentAmt :{
        type : Number,
        required : true
    },
    dueDate : {
        type : Date,
    },
    duration : {
        type : Number
    },
    autoDeduction : {
        type : Boolean,
        default : false
    },
    totalDeductions : {
        type : Number,
        default : 0
    },
    deductionDates : [{
        type : Date
    }],
    deductionDay:{
        type : Date
    },
    deletionReason : {
        type : String 
    }
    
    
})