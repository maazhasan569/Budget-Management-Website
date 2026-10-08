import { Users } from "../../../models/users.models.js";
import ApiError from "../../../utils/ApiError.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import asyncHandler from "../../../utils/asyncHandler.js";
import bcrpt from "bcrypt"
import { generateAccessAndRefreshToken } from "../../../utils/generateJwtToken.js";
import jwt from "jsonwebtoken"
import { OAuth2Client } from "google-auth-library"
import { generateUsername } from "../../../utils/generateUsername.js";
const options = {
    httpOnly: true,
    secure: true
}
const createUserAccount = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const fieldCheck = [email, password].some((inpFields) => {
        return !inpFields || inpFields.trim() === ""
    })

    if (fieldCheck) {
        throw new ApiError(400, "All field required")
    }
    const isUserfound = await Users.findOne({ email })
    if (isUserfound) {
        throw new ApiError(400,
            isUserfound.email === email ? "Email already in use"
                : "password already in use"
        )
    }
    const username = await generateUsername(email)
    const user = await Users.create({
        email,
        password,
        username,
    })

    if (!user) {
        throw new ApiError(500, "error occured while creating the user")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
    const registeredUser = await Users.findByIdAndUpdate(
        user._id,
        {
            refreshToken,
        },
        { new: true }
    ).select("-password -refreshToken")
    return res.status(
        201
    ).cookie(
        "accessToken", accessToken, options
    ).cookie(
        "refreshToken", refreshToken, options
    ).json(
        new ApiResponse(201, "User created", { user, accessToken })
    )

})

const logInUser = asyncHandler(async (req, res) => {
    //check user by comparing his email
    //hash user eneterd password 
    //compare with db password
    //return which details is correct
    //and which is not
    const { email, password } = req.body;


    const getUserByEmail = await Users.findOne({ email })
    if (!getUserByEmail) {
        throw new ApiError(404, "User not found by email")
    }
    
        const isUserPasswordValid = await getUserByEmail.isPasswordValid(password)
        if (!isUserPasswordValid) {
            throw new ApiError(404, "User not found by password")
        }
    
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(getUserByEmail._id)
    console.log(refreshToken)
    const loggedInUser = await Users.findById(getUserByEmail._id).select("-password -refreshToken")
    return res.status(200)
        .cookie(
            "accessToken", accessToken, options
        ).cookie(
            "refreshToken", refreshToken, options
        ).json(
            new ApiResponse(201, "user found", { loggedInUser, accessToken })
        )


})

const getNewAccessToken = asyncHandler(async (req, res) => {
    //send refresh token from frontend
    //verfiy the token to ensure it is valid
    //get the user thro refreshToken
    //match r-t from frontend with r-t from db
    //if not matched
    //expired or used up
    //handover a new refreshtoken and a accesstoken
    const incomingRefreshToken = req.cookies?.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "refresh Token not found in cookie")
    }
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    const isUser = await Users.findById(decodedToken.userId)
    if (!isUser) {
        throw new ApiError(401, "invalid refresh token")
    }
    if (!(incomingRefreshToken === isUser.refreshToken)) {
        throw new ApiError(401, "refresh token expired or already used")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(isUser._id)
    console.log(refreshToken)

    return res.status(201)
        .cookie("refreshToken", refreshToken, options)
        .cookie("accessToken", accessToken, options)
        .json(
            new ApiResponse(201, "created new access and refreshToken", { accessToken })
        )
})

//logout user, del jwt and googletokens
const logOut = asyncHandler(async (req, res) => {
    const user = req.user;
    const googleAccessToken = req.headers['x-google-access-token'];

    if (user.googleRefreshToken && googleAccessToken) {
        try {
            const oAuthClient = new OAuth2Client(
                process.env.CLIENT_ID,
                process.env.CLIENT_SECRET,
                process.env.REDIRECTION_URL
            )

            oAuthClient.setCredentials({
                refresh_token: user.googleRefreshToken,
                access_token: googleAccessToken
            })

            await oAuthClient.revokeCredentials()
        } catch (error) {
            throw new ApiError(401, "failed to revoke google credentials")
        }
    }

    // Clear from database
    await Users.findByIdAndUpdate(
        user._id,
        {
            refreshToken: null,
            googleRefreshToken: null
        },
        { new: true }
    )

    res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, "user logged out", {})
        )
})
export {
    createUserAccount,
    logInUser,
    getNewAccessToken,
    logOut
}