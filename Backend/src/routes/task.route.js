import { Router } from "express";
import { verfiyJWTAccessToken } from "../middlewares/verifyJWT.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyDiskFile } from "../middlewares/verifyDiskFile.js";
import {
    deleteTask,
    editTask,
    createTask,
    markTaskComplete,
    getAllTasks,
    getTaskByCategory,
    getTaskById,
    delTaskFileAttachment
} from "../controllers/task.controller.js";


const router = Router()

router.route("/").get(
    verfiyJWTAccessToken,
    getAllTasks
)

router.route("/category").get(
    verfiyJWTAccessToken,
    getTaskByCategory
)
router.route("/create-task").post(
    verfiyJWTAccessToken,
    upload.single("document"),
    verifyDiskFile,
    createTask
)

router.route("/:taskId").put(
    verfiyJWTAccessToken,
    upload.single("document"),
    verifyDiskFile,
    editTask
)

router.route("/:taskId").delete(
    verfiyJWTAccessToken,
    deleteTask
)

router.route("/:taskId").get(
    verfiyJWTAccessToken,
    getTaskById
)
router.route("/:taskId/mark-complete").put(
    verfiyJWTAccessToken,
    markTaskComplete
)
router.route("/del-task/:taskId").post(
    verfiyJWTAccessToken,
    delTaskFileAttachment
)
export default router