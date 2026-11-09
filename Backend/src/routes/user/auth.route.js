import { Router } from "express"
import 
{ 
    createUserAccount,
    logInUser,
    logOut,
    getNewAccessToken, 
    redirectUser,
    resetPassowordEmail,
    resetPassword
} from "../../controllers/user/auth/auth.controller.js"
import {
    loginUrl,
    registorUrl,
    loginOrRegistorGoogleUser
} from "../../controllers/user/auth/oAuth2.controller.js"
import { verfiyJWTAccessToken } from "../../middlewares/verifyJWT.middleware.js"
const router = Router()

router.route("/create-account").post(createUserAccount)
router.route("/login").post(logInUser)
router.route("/send-email").post(resetPassowordEmail)
router.route("/reset-password").post(resetPassword) 
router.route("/redirect").get(verfiyJWTAccessToken,redirectUser)
router.route("/refresh-token").get(getNewAccessToken)
router.route("/google/registor").get(registorUrl)
router.route("/google/login").get(loginUrl)
router.route("/google/callback").get(loginOrRegistorGoogleUser)
router.route("/logout").post(verfiyJWTAccessToken,logOut)

export default router