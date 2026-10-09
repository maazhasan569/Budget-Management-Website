import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Loader2 } from "lucide-react"

import { GoogleIcon } from "./google-icon"
import { LogoHeader } from "./logo-header"
import { signUp } from "@/api/auth/signup"
import { signIn } from "@/api/auth/login"
import oAuthGoogleRedirectionUrl from "@/api/auth/oAuth"
import { Button } from "@/components/ui/button"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AuthCard({ initialMode = "sign-in" }) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const isSignIn = initialMode === "sign-in"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  })
  const [serverError, setServerError] = useState("")

  // Catch errors returned from OAuth redirect callbacks
  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam) {
      setServerError(decodeURIComponent(errorParam))
      searchParams.delete("error")
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const isEmailValid = email.trim() !== "" && /\S+@\S+\.\S+/.test(email)
  const isPasswordValid = password.length >= 8
  const isFormValid = isEmailValid && isPasswordValid

  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    if (!isFormValid || isLoading) return

    setServerError("")
    setIsLoading(true)

    try {
      if (isSignIn) {
        await signIn({ email, password })
        navigate("/dashboard")
      } else {
        await signUp({ email, password })
        navigate("/dashboard")
      }
    } catch (error) {
      const statusCode = error.statusCode ?? error.response?.status
      const messages = isSignIn
        ? {
            400: "Please enter your email and password.",
            401: "Email or password is incorrect. Please check your details and try again.",
          }
        : {
            400: "Please enter a valid email and password.",
            409: "An account with this email already exists. Try signing in instead.",
          }
      const message =
        messages[statusCode] ||
        "We couldn't complete your request. Please try again."
      setServerError(message)
    } finally {
      setIsLoading(false)
    }
  }

  // Instant redirect without loading animation or text state
  const handleGoogleAuth = () => {
    setServerError("")
    oAuthGoogleRedirectionUrl(isSignIn)
  }

  return (
    <Card className="w-full max-w-sm border-border bg-card text-card-foreground shadow-lg">
      <CardHeader className="space-y-3 text-center">
        <LogoHeader />

        <CardTitle className="text-2xl font-semibold">
          {isSignIn ? "Welcome back" : "Create an account"}
        </CardTitle>

        <CardDescription className="text-muted-foreground">
          {isSignIn
            ? "Enter your email below to sign in to your account"
            : "Enter your email below to create your account"}
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4">
        {/* Exact Server Error Display */}
        {serverError && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm font-medium text-destructive border border-destructive/20 text-center">
            {serverError}
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="grid gap-4">
          {/* Email */}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>

            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              disabled={isLoading}
              onChange={(e) => {
                const val = e.target.value
                setEmail(val)

                if (!val.trim()) {
                  setErrors((prev) => ({ ...prev, email: "Email is required." }))
                } else if (!/\S+@\S+\.\S+/.test(val)) {
                  setErrors((prev) => ({ ...prev, email: "Please enter a valid email address." }))
                } else {
                  setErrors((prev) => ({ ...prev, email: "" }))
                }
              }}
              className={`bg-background text-foreground ${
                errors.email
                  ? "border-destructive focus-visible:ring-destructive"
                  : "border-input"
              }`}
            />

            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>

              {isSignIn && (
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline-offset-4 hover:underline hover:text-foreground transition-colors"
                >
                  Forgot password?
                </button>
              )}
            </div>

            <Input
              id="password"
              type="password"
              value={password}
              disabled={isLoading}
              onChange={(e) => {
                const val = e.target.value
                setPassword(val)

                if (!val) {
                  setErrors((prev) => ({ ...prev, password: "Password is required." }))
                } else if (val.length < 8) {
                  setErrors((prev) => ({ ...prev, password: "Password must be at least 8 characters." }))
                } else {
                  setErrors((prev) => ({ ...prev, password: "" }))
                }
              }}
              className={`bg-background text-foreground ${
                errors.password
                  ? "border-destructive focus-visible:ring-destructive"
                  : "border-input"
              }`}
            />

            {errors.password && (
              <p className="text-xs text-destructive">{errors.password}</p>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full font-medium"
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isSignIn ? "Signing In..." : "Creating Account..."}
              </>
            ) : (
              isSignIn ? "Sign In" : "Create Account"
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>

          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        {/* Google Login - Direct Redirect */}
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2 border-input bg-background hover:bg-muted"
          disabled={isLoading}
          onClick={handleGoogleAuth}
        >
          <GoogleIcon />
          Continue with Google
        </Button>
      </CardContent>

      {/* Switch Auth Mode */}
      <CardFooter className="justify-center border-t border-border pt-4 text-center">
        <p className="text-sm text-muted-foreground">
          {isSignIn ? "Don't have an account? " : "Already have an account? "}

          <button
            type="button"
            onClick={() => {
              setServerError("")
              navigate(isSignIn ? "/sign-up" : "/sign-in")
            }}
            className="font-medium text-primary hover:underline cursor-pointer"
          >
            {isSignIn ? "Create an account" : "Sign in"}
          </button>
        </p>
      </CardFooter>
    </Card>
  )
}