import multer from "multer"
import ApiError from "../utils/ApiError.js";


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix)
    }
})
const fileFilter = (req, file, cb) => {
    try {
        
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new ApiError('Invalid initial file type header. Only images and PDFs allowed.'), false);
        }


    } catch (err) {
        cb(err.msg, false)
    }
}

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }

})