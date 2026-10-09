import { OAuth2Client } from "google-auth-library"
import asyncHandler from "../../../utils/asyncHandler.js"
import { Users } from "../../../models/users.models.js"
import ApiError from "../../../utils/ApiError.js"
import ApiResponse from "../../../utils/ApiResponse.js"
import { generateAccessAndRefreshToken } from "../../../utils/generateJwtToken.js"
import { generateUsername } from "../../../utils/generateUsername.js"

const getGoogleTokenAndPayload = async (code) => {

    if (!code) {
        throw new ApiError(400, "auth code not found")
    }

    try {
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
    try {
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
            throw new ApiError(500, "failed to create new user")
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

    } catch (error) {
        const isRegistration = req.query.state === "action=register";

        let message = "Google sign-in couldn't be completed. Please try again.";

        if (error.code === 11000) {
            message = "We couldn't create your account right now. Please try again.";
        } else if (isRegistration && error.statusCode === 409) {
            message = "An account with this Google email already exists. Choose Sign in with Google.";
        } else if (!isRegistration && error.statusCode === 404) {
            message = "No account is linked to this Google email. Choose Create an account first.";
        }

        return res.redirect(
            `${process.env.CORS_ORIGIN}${isRegistration ? "sign-up" : "sign-in"}?error=${encodeURIComponent(message)}`
        );
    }
})
export {
    loginUrl,
    registorUrl,
    loginOrRegistorGoogleUser,
}