import ApiError from "../utils/ApiError.js"
import { Task } from "../models/dailyLife/task.models.js"
import { isValidObjectId } from "mongoose"
import pushToHistory from "../utils/pushToHistory.js"
import cron from "node-cron"
import { FileService } from "./fileUpload.service.js"
export class TaskService extends FileService {
    constructor(userId, config = {}) {
        super(userId, config.fileFieldName, config.filePath)
        this.userId = userId
        this.taskName = config.taskName,
            this.taskDescription = config.taskDescription
        this.category = config.category
        this.dueDate = null
        this.dateValue = config.dateValue// e.g 2 month 2 is the val . 5 weeks 5 is the val
        this.dueDateUnit = config.dueDateUnit

    }

    validateTask() {
        const fieldCheck = [this.taskName]
            .some((field) => {
                if (typeof field === 'string') {
                    return !field || field.trim() === ""
                }
                if (!field) return !field
            })


        if (fieldCheck) {
            throw new ApiError(400, "All fields required")
        }
        // if (this.dateValue < 0) {
        //     throw new ApiError(400, "Invalid date value")
        // }

    }

    calculateDueDate(val, unit) {
        const currentDate = new Date()

        const numericalVal = parseInt(val, 10)
        if (isNaN(numericalVal)) {
            throw new ApiError("invalid date value. it must be number")
        }

        switch (unit.toLowerCase()) {
            case "hours":
                currentDate.setHours(currentDate.getHours() + numericalVal)
                console.log(currentDate)
                break;

            case "days":
                currentDate.setDate(currentDate.getDate() + numericalVal)
                break;

            case "months":
                currentDate.setMonth(currentDate.getMonth() + numericalVal)
                break;
            default:
                throw new ApiError(400, "Invalid unit provided")
        }
        return currentDate
    }
    async createTask() {
        try {

            this.validateTask()
            if (this.dateValue && this.dueDateUnit) {
                this.dueDate = this.calculateDueDate(this.dateValue, this.dueDateUnit)
            }

            let fileData = { fileUrl: null, publicId: null }
            if (this.filePath) {
                fileData = await this.uploadFile()
            }

            console.log(fileData.publicId)
            const newTask = await Task.create({
                userId: this.userId,
                name: this.taskName,
                description: this.taskDescription,
                category: this.category,
                status: "in_progress",
                dueDate: this.dueDate,
                document: fileData.fileUrl,
                publicId: fileData.publicId
            })

            return newTask
        } catch (err) {
            console.log(err)
            throw new ApiError(500, err.stack)
        }
    }

    async editTask(taskId) {

        if (!taskId) {
            throw new ApiError(400, "task id not found")
        }

        if (!isValidObjectId(taskId)) {
            throw new ApiError(400, "Invalid task id")
        }
        try {

            if (!this.taskName) {
                throw new ApiError(400, "task name is required")
            }

            const task = await Task.findOne({ _id: taskId, userId: this.userId })

            if (this.dateValue && this.dueDateUnit) {
                this.dueDate = this.calculateDueDate(val, unit)
            }
            let fileData = { fileUrl: task.document, publicId: task.publicId }
            if (this.filePath) {
                fileData = await this.updateFile(taskId, "Task")
            }
            const updatedTask = await Task.findOneAndUpdate(
                { _id: taskId, userId: this.userId },
                {
                    name: this.taskName,
                    description: this.taskDescription,
                    category: this.category,
                    dueDate: this.dueDate || task.dueDate,
                    document: fileData.fileUrl,
                    publicId: fileData.publicId
                },
                { returnDocument: 'after' }
            )
            return updatedTask
        } catch (err) {
            throw new ApiError(500, err.message)
        }
    }

    async delTask(taskId) {
        if (!taskId) {
            throw new ApiError(400, "task id not found")
        }

        if (!isValidObjectId(taskId)) {
            throw new ApiError(400, "Invalid task id")
        }

        try {

            const task = await Task.findOne({ _id: taskId, userId: this.userId })
            await this.deleteFile(taskId, Task)
            task.status = "Deleted"
            await task.save()
            const deletedTask = await pushToHistory(Task, this.userId, taskId, "tasks")
            return deletedTask

        } catch (err) {
            throw new ApiError(500, err.message)
        }

    }

    async setTaskCompleted(taskId) {
        //user presses the btn on the frontend
        //an api is called
        // api runs a db query
        //set task as completed if the task is not a due a date task
        //or due date hasnot reached
        try {
            if (!isValidObjectId(taskId)) {
                throw new ApiError(400, "Invalid task id")
            }

            const task = await Task.findOne({
                userId: this.userId,
                _id: taskId
            })

            if (task.status !== "in_progress")
                throw new ApiError(400, "task is overdued ")

            task.status = "Completed"
            const updatedTask = await task.save()
            await pushToHistory(Task, this.userId, taskId, "tasks")

            return updatedTask

        } catch (err) {
            throw new ApiError(500, err.message)
        }

    }

    async setTaskOverDue() {
        //get all the tasks 
        //mark task overdue when the due date been reached


        try {

            const tasks = await Task.find({ userId: this.userId })
            for (const task of tasks) {
                const currentDate = new Date()
                if (task.dueDate && currentDate > task.dueDate) {
                    task.status = "Overdue"
                    await task.save()
                }
            }

        } catch (err) {
            throw new ApiError(400, err.message)
        }

    }

    //combine doc servive . to allow adding doc inside todo list

}


