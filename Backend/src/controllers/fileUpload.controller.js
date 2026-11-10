import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Document } from "../models/document.models.js";
import { Users } from "../models/users.models.js";
import fileUpload from "../utils/fileUpload.js";
import ApiResponse from "../utils/ApiResponse.js";
import { v2 as cloudinary } from "cloudinary"


const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary delete error:", error);
  }
};

const uploadFile = asyncHandler(async (req, res) => {
    const typeKey = req.body.type?.toLowerCase()
    const filePath = req.filePath
    if (!typeKey || !["document", "avatar"].includes(typeKey)) {
        throw new ApiError(400, "No file type found (doc/avatar)")
    }
    const { fileUrl, publicId } = await fileUpload(filePath)
    const response = typeKey === "document" ?
        await Document.create({
            document: fileUrl,
            publicId,
            userId : req.user._id
        }) : await Users.findByIdAndUpdate(
            req.user._id,
            {
                avatar: fileUrl,
                publicId,
            }
        )

    if (!response) {
        throw new ApiError(500, `failed to save ${typeKey} to Database`)
    }

    return res.status(201)
        .json(
            new ApiResponse(201, `New ${typeKey} file created`, { [typeKey]: fileUrl })
        )
})


const updateFile = asyncHandler(async (req, res) => {

    const typeKey = req.body.type?.toLowerCase()
    const { id } = req.params
    const filePath = req.filePath
    if (!typeKey || !["document", "avatar"].includes(typeKey)) {
        throw new ApiError(400, "No file type found (doc/avatar)")
    }

    const config = {
        document: { model: Document, field: "document", id },
        avatar: { model: Users, field: "avatar", id: req.user._id }
    }
    const selectedType = config[typeKey]
    const isExistingFile = await selectedType.model.findById(selectedType.id)
    if (!isExistingFile) {
        throw new ApiError(400, "file not found")
    }
    await deleteFromCloudinary(isExistingFile.publicId)
    const { fileUrl, publicId } = await fileUpload(filePath)
    const newFile = await selectedType.model.findByIdAndUpdate(
        selectedType.id,
        {
            [selectedType.field]: fileUrl,
            publicId,
        },
        { new: true }
    )

    return res.status(200)
        .json(
            new ApiResponse(200, ` ${typeKey} updated`, { [typeKey]: fileUrl })
        )


})

const deleteFile = asyncHandler(async (req, res) => {
    //find the file by id
    //if file run
    //if 
    const { id } = req.params
    const typeKey = req.body.type?.toLowerCase()
    if (!typeKey || !["document", "avatar"].includes(typeKey)) {
        throw new ApiError(400, "No file type found (doc/avatar)")
    }
    const config = {
        document: { model: Document, field: "document", id },
        avatar: { model: Users, field: "avatar", id: req.user._id }
    }
    const selectedType = config[typeKey]

    const existingFile = await selectedType.model.findById(selectedType.id)
    if (!existingFile) {
        throw new ApiError(400, "No file found")
    }
    await deleteFromCloudinary(existingFile.publicId)

    const response = selectedType.field === "document" ?
        await selectedType.model.findByIdAndDelete(selectedType.id)
        : await selectedType.model.findByIdAndUpdate(
            selectedType.id,
            { $unset: { avatar: 1, publicId: 1 } },
            { new: true },
        )


    return res.status(200)
        .json(
            new ApiResponse(200, ` ${typeKey} deleted`, {})
        )


})

export {
    updateFile,
    uploadFile,
    deleteFile,
}