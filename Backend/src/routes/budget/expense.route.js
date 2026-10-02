import { Router } from "express";
import {
     getBudget,
     createExpense,
     editExpense,
     showAllExpense,
     getExpenseCategory,
     getExpenseById,
     deleteExpense,
     updatedBudget

} from "../../controllers/budget/expense.controller.js";
import { verfiyJWTAccessToken } from "../../middlewares/verifyJWT.middleware.js";
const router = Router()
router.route("/").get(verfiyJWTAccessToken ,showAllExpense)
router.route("/budget").get(verfiyJWTAccessToken,getBudget)
router.route("/update-budget").patch(verfiyJWTAccessToken,updatedBudget)
router.route("/create-expense").post(verfiyJWTAccessToken,createExpense)
router.route("/category").get(verfiyJWTAccessToken,getExpenseCategory)

router.route("/edit-expense/:expenseId").put(verfiyJWTAccessToken,editExpense)
router.route("/:expenseId").get(verfiyJWTAccessToken,getExpenseById)
router.route("/:expenseId").delete(verfiyJWTAccessToken,deleteExpense)
export default router