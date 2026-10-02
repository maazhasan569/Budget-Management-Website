import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(
    cors({
        origin : process.env.CORS_ORIGIN,
        credentials : true
    })
)

app.use(express.json({limit : "16kb"}))
app.use(express.urlencoded({extended : true , limit : "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

import authRouter from "./routes/user/auth.route.js"
import userRouter from "./routes/user/user.route.js"
import expenseRouter from "./routes/budget/expense.route.js"
import goalRouter from "./routes/budget/goal.route.js"
import loanRouter from "./routes/budget/loan.route.js"
import taskRouter from  "./routes/task.route.js"
import dashboardRouter from "./routes/dashboard.route.js"
app.use("/api/v1/auth" , authRouter)
app.use("/api/v1/user" , userRouter)
app.use("/api/v1/expenses", expenseRouter)
app.use("/api/v1/goals",goalRouter)
app.use("/api/v1/loans", loanRouter)
app.use("/api/v1/tasks" ,taskRouter )
app.use("/api/v1/dashboard" , dashboardRouter)
// app.use((err, req, res, next) => {
//     let statusCode = err.statusCode || 500;
//     let message = err.message || "Internal Server Error";

//     // Handle custom ApiError instances
//     return res.status(statusCode).json({
//         success: false,
//         statusCode,
//         message,
//         errors: err.errors || [],
//         stack: process.env.NODE_ENV === "development" ? err.stack : undefined
//     });
// });

export default app