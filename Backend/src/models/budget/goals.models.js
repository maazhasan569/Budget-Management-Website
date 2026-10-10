import mongoose from "mongoose";

const goalsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true
    },
    goalName : {
        type : String,
        required : true,

    },
    achievementDate : {
        type : Date,
        required : true
    },
    duration :{
        type : Number,
    },
    targetAmount :{
        type : Number,
        required : true
    },
    currentAmt : {
        type : Number,
        default : 0
    },
    status : {
        type : String,
        required : true,
        default : "InProgress",
        enum : {
            values : ["in_progress" , "Paused","no_funds", "Abondened" , "Achieved" , "unAchieved"] ,
            message : "InProgress , Paused , Abondened , Achieved are acceptable"
        }
    },
    type : {
        type : String,
        required : true,
        enum : {
            values : ["Monthly" , "Yearly"],
            message : "Only Monthly or Yearly goals are valid"
        }
    },
    category : {
        type : String,
        default : "General"
    },
    autoDeduction : {
        type : Boolean,
        default : false
    },
    totalDeductions : {
        type : Number,
        default : 0
    },
    deductionDay : {
        type : Date
    },
    deductionDates:[{
        type : Date
    }]

}, {
    timestamps: true
})

export const Goal = mongoose.model("Goal" , goalsSchema)