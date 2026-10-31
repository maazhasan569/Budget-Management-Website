import { Router } from "express";
import { verfiyJWTAccessToken } from "../../middlewares/verifyJWT.middleware.js";
import { upload } from "../../middlewares/multer.middleware.js";
import { verifyDiskFile } from "../../middlewares/verifyDiskFile.js";
import { uploadFile, updateFile, deleteFile } from "../../controllers/user/fileUpload.controller.js";
import { questions, updateCredentials } from "../../controllers/user/question.controller.js";
import { fetchHistory } from "../../controllers/user/history.controller.js";
import { getIncomeAndBackBalance , updateIncome, updateUserPaymentSettings} from "../../controllers/user/usercredential.controller.js";

const router = Router()

router.route("/upload-file").post(
    verfiyJWTAccessToken,
    upload.single("File"),
    verifyDiskFile,
    uploadFile
)
router.route("/income-bankbalance").get(
    verfiyJWTAccessToken,
    getIncomeAndBackBalance
)
router.route("/update-income").patch(
    verfiyJWTAccessToken,
    updateIncome
)
router.route("/history").get(
    verfiyJWTAccessToken,
    fetchHistory
)
router.route("update-payment-seting").patch(updateUserPaymentSettings)
router.route("/update-file/:id").put(
    verfiyJWTAccessToken,
    upload.single("File"),
    verifyDiskFile,
    updateFile
)
router.route("/delete-file/:id").delete(
    verfiyJWTAccessToken,
    deleteFile
)

router.route("/question").post(verfiyJWTAccessToken, questions)
router.route("/update-user").post(verfiyJWTAccessToken, updateCredentials)
export default router