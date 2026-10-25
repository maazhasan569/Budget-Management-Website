import ApiError from "../utils/ApiError.js"
import { v2 as cloudinary } from "cloudinary"
import fileUpload from "../utils/fileUpload.js"
export class FileService {
    constructor(userId, fileFieldName, filePath) {
        this.fileFieldName = fileFieldName
        this.filePath = filePath
        this.userId = userId
    }


    async deleteFromCloudinary (publicId){
         if (!publicId) return;
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
                throw new ApiError(500 , err.message)
          }
    } 
    async uploadFile() {
       
        if (!this.fileFieldName || !["document", "avatar"].includes(this.fileFieldName)) {
            throw new ApiError(400, "No file type found (doc/avatar)")
        }
        try {
            const { fileUrl, publicId } = await fileUpload(this.filePath)

            return {fileUrl, publicId}
        } catch (err) {
            
            throw new ApiError(500, err.message)
        }
    }


    async updateFile(id, Model) {
        if (!this.fileFieldName || !["document", "avatar"].includes(this.fileFieldName)) {
            throw new ApiError(400, "No file type found (doc/avatar)")
        }

        try {
            const modelRecord = await Model.findById(id)
            if (!modelRecord.document) {
                throw new ApiError(400, "file not found")
            }
            await this.deleteFromCloudinary(isExistingFile.publicId)
            const { fileUrl, publicId } = await fileUpload(this.filePath)
            const newFile = await Model.findByIdAndUpdate(
                id,
                {
                    document: fileUrl,
                    publicId,
                },
                { new: true }
            )
            return newFile
        } catch (err) {
            throw new ApiError(500, err.message)
        }
    }

    async deleteFile(id , Model) {
        try {
            
            
            const modelRecord = await Model.findById(id)
            if(!modelRecord.document && !modelRecord.publicId) return {}
            await this.deleteFromCloudinary(modelRecord.publicId)
            const response = await Model.findByIdAndUpdate(
                id,
                {
                    document : null,
                    publicId : null
                }
            )
               
            return response
        }catch(err){
            throw new ApiError(500 , err.message)
    }
    }
}

