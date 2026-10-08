import { useState } from "react"
import { GoogleIcon } from "./google-icon"
import { LogoHeader } from "./logo-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


export function AuthCard({ initialMode = "sign-in" }) {
  const [mode, setMode] = useState(initialMode)
  const isSignIn = mode === "sign-in"

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
        <form onSubmit={(e) => e.preventDefault()} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              className="bg-background border-input text-foreground"
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              {isSignIn && (
                <a
                  href="#"
                  className="text-xs text-muted-foreground underline-offset-4 hover:underline hover:text-foreground transition-colors"
                >
                  Forgot password?
                </a>
              )}
            </div>
            <Input
              id="password"
              type="password"
              required
              className="bg-background border-input text-foreground"
            />
          </div>

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
            <span className="bg-card px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        {/* Google Login */}
        <Button
          variant="outline"
          className="w-full gap-2 border-input bg-background hover:bg-muted"
        >
          <GoogleIcon />
          Continue with Google
        </Button>
      </CardContent>

      <CardFooter className="justify-center border-t border-border pt-4 text-center">
        <p className="text-sm text-muted-foreground">
          {isSignIn ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => setMode(isSignIn ? "sign-up" : "sign-in")}
            className="font-medium text-primary hover:underline cursor-pointer"
          >
            {isSignIn ? "Create an account" : "Sign in"}
          </button>
        </p>
      </CardFooter>
    </Card>
  )
}