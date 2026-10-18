import mongoose from "mongoose";

export const taskHistorySchema = new mongoose.Schema({
    userId : {
        type: mongoose.Schema.Types.ObjectId,
        ref : "Users", 
        required : true
    },
    name : {
        type : String,
        required : true,
    },
    description : {
        type : String,
    },
    category : {
        type : String,
        default : "General"
    },
    status : {
        type : String,
        required : true,
        default : "in_progress",
        enum : ["in_progress" , "Completed" , "Deleted" , "Overdue"]
    },
    dueDate : {
        type : Date,
    },
    dueDateUnit : {
        type : String,
        enum : ["hours" , "days" , "months"]
    },
    document : {
        type : String, // cloudinary url
    },
    publicId:{
        type : String
    }
})