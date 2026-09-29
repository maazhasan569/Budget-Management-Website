import asyncHandler from "../utils/asyncHandler.js";
import { TaskService } from "../service/task.service.js"; 
import ApiResponse from "../utils/ApiResponse.js";
import { Task } from "../models/dailyLife/task.models.js";
import ApiError from "../utils/ApiError.js";
import { paginate } from "../utils/pagination.js";


const getAllTasks = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sortBy, sortType, } = req.query
    const userId = req.user._id
    const options = {
        page,
        limit,
        sortBy,
        sortType,
        userId
    }

     const task = new TaskService(userId)
     await task.setTaskOverDue()
    const taskData = await paginate(Task, options)

    if (!taskData.fetchedDoc.length) {
        throw new ApiError(404, "Task not found")
    }

    return res.status(200)
        .json(
            new ApiResponse(200, "fetched all tasks", taskData)
        )
})

const getTaskByCategory = asyncHandler(async (req,res) => {
    const { page = 1, limit = 10, sortBy, sortType, category} = req.query
    const userId = req.user._id
    const options = {
        page,
        limit,
        sortBy,
        sortType,
        userId,
        category,
    }

    const taskData = await paginate(Task, options)

    if (!taskData.fetchedDoc.length) {
        throw new ApiError(404, "Task not found")
    }

    res.status(200)
        .json(
            new ApiResponse(200, "tasks fetched by category", taskData)
        )
})

const getTaskById = asyncHandler(async(req,res) => {
    const { taskId } = req.params
    const userId = req.user._id
    const getTask = await Task.findOne({ _id : taskId, userId })
    res.status(200)
        .json(
            new ApiResponse(200, getTask ? "Task fetched" : "Task not found by Id", getTask)
        )
})
const createTask = asyncHandler(async (req, res) => {

    const fileFieldName = req.file?.fieldname?.toLowerCase()
    const filePath = req.filePath
    const {
        taskName,
        taskDescription,
        category,
        dateValue,
        dueDateUnit
    } = req.body
    console.log(req.body)
    const userId = req.user._id

    const task = new TaskService(userId, {
        taskName,
        taskDescription,
        category,
        dateValue,
        dueDateUnit,
        filePath,
        fileFieldName,
    })

    const newTask = await task.createTask()
    console.log("runing...2222")
    return res.status(200)
        .json(
            new ApiResponse(200, "new task created", newTask)
        )
})

const editTask = asyncHandler(async (req, res) => {

    const fileFieldName = req.file?.fieldname?.toLowerCase()
    const filePath = req.filePath
    const {
        taskName,
        taskDescription,
        category,
        dateValue,
        dueDateUnit
    } = req.body

    console.log(req.body)
    const userId = req.user._id
    const { taskId } = req.params


    const task = new TaskService(userId, {
        taskName,
        taskDescription,
        category,
        dateValue,
        dueDateUnit,
        filePath,
        fileFieldName,
    })


    const updatedTask = await task.editTask(taskId)

    res.status(200)
        .json(
            new ApiResponse(200, "task updated", updatedTask)
        )
})

const deleteTask = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const { taskId } = req.params


    const task = new TaskService(userId)

    const deletedTask = await task.delTask(taskId)

    res.status(200)
        .json(
            new ApiResponse(200, "task deleted", deletedTask)
        )
})

const markTaskComplete = asyncHandler(async (req, res) => {

    const userId = req.user._id
    const { taskId } = req.params

    const task = new TaskService(userId)
    const updateTaskStatus = await task.setTaskCompleted(taskId)

    return res.status(200)
        .json(
            new ApiResponse(200, "task status marked to complete", updateTaskStatus)
        )
})


export {
    createTask,
    editTask,
    deleteTask,
    markTaskComplete,
    getAllTasks,
    getTaskByCategory,
    getTaskById
}