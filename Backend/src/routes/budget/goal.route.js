import { Router } from "express";
import {
    createGoal,
    getAllGoals,
    getGoalById,
    getGoalsByCategory,
    delGoal,
    autoDeductAmt,
    manualDeduction,
    totalGoalsAmtPaid,
    totalGoalsAmtRemaining,
    editGoal
} from "../../controllers/budget/goal.controller.js";
import { verfiyJWTAccessToken } from "../../middlewares/verifyJWT.middleware.js";


const router = Router()
router.route("/").get(verfiyJWTAccessToken, getAllGoals)
router.route("/create-goal").post(verfiyJWTAccessToken, createGoal)
router.route("/category").get(verfiyJWTAccessToken, getGoalsByCategory)
router.route("/auto-deduct").post(verfiyJWTAccessToken,autoDeductAmt)
router.route("/amt-paid").get(verfiyJWTAccessToken, totalGoalsAmtPaid)
router.route("/amt-remaining").get(verfiyJWTAccessToken, totalGoalsAmtRemaining)

router.route("/manual-deduct/:goalId").post(verfiyJWTAccessToken, manualDeduction)
router.route("/:goalId").get(verfiyJWTAccessToken, getGoalById)
router.route("/:goalId").delete(verfiyJWTAccessToken, delGoal)
router.route("/:goalId").put(verfiyJWTAccessToken, editGoal)

export default router
