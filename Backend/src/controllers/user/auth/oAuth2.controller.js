import { OAuth2Client } from "google-auth-library"
import asyncHandler from "../../../utils/asyncHandler.js"
import { Users } from "../../../models/users.models.js"
import ApiError from "../../../utils/ApiError.js"
import ApiResponse from "../../../utils/ApiResponse.js"
import { generateAccessAndRefreshToken } from "../../../utils/generateJwtToken.js"
import { generateUsername } from "../../../utils/generateUsername.js"

const getGoogleTokenAndPayload = async (code) => {

    try {
        if (!code) {
            throw new ApiError(401, "auth code not found")
        }
        const { tokens } = await oauthClient.getToken(code)
        oauthClient.setCredentials(tokens)
        const ticket = await oauthClient.verifyIdToken(
            {
                idToken: tokens.id_token,
                audience: process.env.CLIENT_ID
            }
        )
        const payload = ticket.getPayload()
        return { payload, refresh_token: tokens.refresh_token, access_token: tokens.access_token }
    } catch (err) {
        throw new ApiError(401, "unauthorized token or expired")
    }

}
const oauthClient = new OAuth2Client(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECTION_URL
)

const options = {
    httpOnly: true,
    secure: true
}
const loginUrl = asyncHandler((req, res) => {

    const authUrl = oauthClient.generateAuthUrl({
        access_type: "offline",
        prompt: "select_account",
        scope: [
            "openid",
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email",
        ],
        state: 'action=login'
    })

    res.redirect(authUrl)
})

const registorUrl = asyncHandler((req, res) => {

    const authUrl = oauthClient.generateAuthUrl({
        access_type: "offline",
        prompt: "select_account",
        scope: [
            "openid",
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email",
        ],
        state: 'action=register'
    })

    res.redirect(authUrl)
})

const loginOrRegistorGoogleUser = asyncHandler(async (req, res) => {
    //if user logging
    //
    
    const { code, state } = req.query;
    const decodedState = decodeURIComponent(state)
    const { payload, refresh_token, access_token } = await getGoogleTokenAndPayload(code)
    const email = payload.email
    const username = await generateUsername(payload.email)
    const isUser = await Users.findOne({ email })
    if (!isUser && state === 'action=login') {
        throw new ApiError(404, "User account not found")
    }
    if (isUser && state === 'action=register') {
        throw new ApiError(409, "account already present")
    }
    const user = isUser || await Users.create({
        googleId: payload.sub,
        username: username,
        email: payload.email,
        googleRefreshToken: refresh_token,
    })
    if (!user) {
        throw new ApiError("failed to create new user do ")
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
    user.googleRefreshToken = refresh_token
    await user.save({ validateBeforeSave: false })
    const userKeyName = state === 'action=register' ? "registoredUser" : "loggedInUser"
    return res.status(200)
        .cookie(
            "accessToken", accessToken, options
        )
        .cookie(
            "refreshToken", refreshToken, options
        ).json(
            new ApiResponse(200, "user logged in successfully", {
                [userKeyName]: user,
                accessToken,
                googleAccessToken: access_token
            })
        )


})
export {
    loginUrl,
    registorUrl,
    loginOrRegistorGoogleUser,
}