import { v2 as cloudinary } from "cloudinary"
import fs from "fs"


cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET 
})
const fileUpload = async (filePath) => {
    try {
        // Configuration
        
        if (!filePath) return null


        const upload = await cloudinary.uploader.upload(filePath, {
            resource_type: "auto",
        })

        console.log(upload)
        return {fileUrl : upload.secure_url , publicId : upload.public_id}
    } catch (err) {
        console.log(err)
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
        }
        console.log(`cloudinary file upload failed , ${err}`)
        return null
    }
}
export default fileUpload