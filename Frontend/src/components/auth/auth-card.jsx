import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { GoogleIcon } from "./google-icon"
import { LogoHeader } from "./logo-header"

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

  const isSignIn = initialMode === "sign-in"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  })

  const validateForm = () => {
    const newErrors = {
      email: "",
      password: "",
    }

    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required."
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address."
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required."
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters."
    }

    setErrors(newErrors)

    return !newErrors.email && !newErrors.password
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const isValid = validateForm()

    if (!isValid) {
      return
    }

    // Authentication will be added here later.
    console.log("Form submitted:", {
      email,
      password,
    })
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
        <form onSubmit={handleSubmit} className="grid gap-4">

          {/* Email */}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>

            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)

                if (errors.email) {
                  setErrors((prev) => ({
                    ...prev,
                    email: "",
                  }))
                }
              }}
              className={`bg-background text-foreground ${
                errors.email
                  ? "border-destructive focus-visible:ring-destructive"
                  : "border-input"
              }`}
            />

            {errors.email && (
              <p className="text-sm text-destructive">
                {errors.email}
              </p>
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
                  onClick={() => {
                    // Forgot password functionality will be added later.
                  }}
                >
                  Forgot password?
                </button>
              )}
            </div>

            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)

                if (errors.password) {
                  setErrors((prev) => ({
                    ...prev,
                    password: "",
                  }))
                }
              }}
              className={`bg-background text-foreground ${
                errors.password
                  ? "border-destructive focus-visible:ring-destructive"
                  : "border-input"
              }`}
            />

            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password}
              </p>
            )}
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full font-medium">
            {isSignIn ? "Sign In" : "Create Account"}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>

          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or
            </span>
          </div>
        </div>

        {/* Google Login */}
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2 border-input bg-background hover:bg-muted"
        >
          <GoogleIcon />
          Continue with Google
        </Button>
      </CardContent>

      {/* Switch Auth Mode */}
      <CardFooter className="justify-center border-t border-border pt-4 text-center">
        <p className="text-sm text-muted-foreground">
          {isSignIn
            ? "Don't have an account? "
            : "Already have an account? "}

          <button
            type="button"
            onClick={() =>
              navigate(isSignIn ? "/sign-up" : "/sign-in")
            }
            className="font-medium text-primary hover:underline cursor-pointer"
          >
            {isSignIn ? "Create an account" : "Sign in"}
          </button>
        </p>
      </CardFooter>
    </Card>
  )
}