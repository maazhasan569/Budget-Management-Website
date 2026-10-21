const accessTokenCookieOptions = {
    httpOnly : true,
    secure : true,
    maxAge: 15 * 60 * 1000, // 15 min
    sameSite: "none" // for production
}

const refreshTokenCookieOptions = {
    httpOnly : true,
    secure : true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7days
    sameSite : "none"
}

export {
    accessTokenCookieOptions,
    refreshTokenCookieOptions
}