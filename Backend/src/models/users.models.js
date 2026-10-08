import mongoose from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
const usersSchema = new mongoose.Schema({

    username: {
        type: String,
        unique: true,
        lowercase: true
    },
    identity: {
        type: String,
        enum: {
           values:  ["Student", "Working Adults", "Retires"],
            message: "Please select a valid identity: Student, Working Adults, or Retirees"
        }

    },
    income: {
        type: Number,
    },
    netIncome : {
        type : Number
    },
    currency: {
        type: String,
    },
    password: {
        type: String,
        default: undefined,

    },
    bankBalance : {
        type : Number,
    },
    email: {
        type: String,
        unique: true,
        lowercase: true
    },
    avatar: {
        type: String, // cloudinary url
    },
    budget : {
        type : Number,

    },
    remainingBudget : {
        type : Number,
    },
    publicId: {
        type: String,
    },
    refreshToken: {
        type: String,
        default: null,
        sparse: true
    },
    googleRefreshToken: {
        type: String,
        default: null,
        sparse: true
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    }

},
    {
        timestamps: true
    })

usersSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10)
})

usersSchema.methods.isPasswordValid = async function (passcode) {
    return await bcrypt.compare(passcode, this.password)
}

usersSchema.methods.generateAccessToken = function () {

    return jwt.sign(
        {
            userId: this._id,
            username: this.username,
            password: this.password,
            email: this.email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
usersSchema.methods.generateRefreshToken = function () {

    return jwt.sign(
        {
            userId: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
export const Users = mongoose.model("User", usersSchema)