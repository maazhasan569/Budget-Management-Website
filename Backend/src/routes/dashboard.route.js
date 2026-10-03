import { Router } from "express";
import {
    expenseCategoryPercentages,
    financialScore,
    flaggedDocuments,
    GoalAndLoanAlert,
    goalProgress,
    loanProgress,
    spendingTrends
} from "../controllers/dashboard.controller.js";
import { verfiyJWTAccessToken } from "../middlewares/verifyJWT.middleware.js";


const router = Router()

router.route(" ").get(verfiyJWTAccessToken, financialScore)
router.route("/goal-progress").get(verfiyJWTAccessToken, goalProgress)
router.route("/loan-progress").get(verfiyJWTAccessToken, loanProgress)
router.route("/goal-loan-alerts").get(verfiyJWTAccessToken, GoalAndLoanAlert)
router.route("/flagged-docs").get(verfiyJWTAccessToken, flaggedDocuments)
router.route("/spending-trends").get(verfiyJWTAccessToken, spendingTrends)
router.route("/expense-categories").get(verfiyJWTAccessToken, expenseCategoryPercentages)

export default router