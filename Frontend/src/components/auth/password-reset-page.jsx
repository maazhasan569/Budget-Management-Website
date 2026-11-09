import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { ArrowLeft, Loader2, Mail, ShieldCheck } from "lucide-react"

import { resetPassword, sendPasswordResetEmail } from "@/api/auth/password"
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
import { LogoHeader } from "@/components/auth/logo-header"

function PasswordResetFrame({ children, description, title }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm border-border bg-card text-card-foreground shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <LogoHeader />
          <CardTitle className="text-2xl font-semibold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {children}
      </Card>
    </main>
  )
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return

    const normalizedEmail = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Enter a valid email address.")
      return
    }

    setError("")
    setSubmitting(true)
    try {
      await sendPasswordResetEmail(normalizedEmail)
      setSent(true)
    } catch (requestError) {
      setError(requestError.message || "We couldn’t send the reset link. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PasswordResetFrame
      title={sent ? "Check your inbox" : "Forgot your password?"}
      description={
        sent
          ? `If an account exists for ${email.trim()}, a password reset link is on its way.`
          : "Enter the email address associated with your account and we’ll send you a reset link."
      }
    >
      <CardContent className="grid gap-4">
        {sent ? (
          <div className="grid justify-items-center gap-3 rounded-lg border border-border bg-muted/40 p-5 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Mail className="size-5" aria-hidden="true" />
            </span>
            <p className="text-sm text-muted-foreground">
              The link is valid for 15 minutes. Check your spam folder if it doesn’t arrive.
            </p>
            <Button type="button" variant="outline" onClick={() => setSent(false)}>
              Try another email
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="forgot-password-email">Email</Label>
              <Input
                id="forgot-password-email"
                type="email"
                autoComplete="email"
                placeholder="m@example.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setError("")
                }}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "forgot-password-error" : undefined}
                disabled={submitting}
                required
              />
            </div>
            {error && (
              <p id="forgot-password-error" role="alert" className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                  Sending link…
                </>
              ) : (
                "Send reset link"
              )}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="justify-center border-t border-border pt-4">
        <Link to="/auth/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to sign in
        </Link>
      </CardFooter>
    </PasswordResetFrame>
  )
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")?.trim() ?? ""
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [updated, setUpdated] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return
    if (!token) {
      setError("This reset link is missing its token. Request a new password reset link.")
      return
    }
    if (password.length < 8) {
      setError("Choose a password with at least 8 characters.")
      return
    }
    if (password !== confirmPassword) {
      setError("The passwords don’t match.")
      return
    }

    setError("")
    setSubmitting(true)
    try {
      await resetPassword(token, password)
      setUpdated(true)
    } catch (requestError) {
      setError(requestError.message || "We couldn’t update your password. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PasswordResetFrame
      title={updated ? "Password updated" : "Create a new password"}
      description={
        updated
          ? "Your password has been changed. Sign in with your new password."
          : "Choose a strong password that you haven’t used for this account before."
      }
    >
      <CardContent className="grid gap-4">
        {updated ? (
          <div className="grid justify-items-center gap-3 rounded-lg border border-border bg-muted/40 p-5 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <p className="text-sm text-muted-foreground">Your account is ready to use again.</p>
            <Button asChild className="w-full">
              <Link to="/auth/login">Continue to sign in</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setError("")
                }}
                aria-describedby="new-password-hint"
                disabled={submitting}
                required
              />
              <p id="new-password-hint" className="text-xs text-muted-foreground">
                Use at least 8 characters.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-new-password">Confirm new password</Label>
              <Input
                id="confirm-new-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value)
                  setError("")
                }}
                disabled={submitting}
                required
              />
            </div>
            {error && (
              <p role="alert" className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={submitting || !token}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                  Updating password…
                </>
              ) : (
                "Update password"
              )}
            </Button>
            {!token && (
              <Link to="/forgot-password" className="text-center text-sm text-primary underline-offset-4 hover:underline">
                Request a new reset link
              </Link>
            )}
          </form>
        )}
      </CardContent>
      {updated && (
        <CardFooter className="justify-center border-t border-border pt-4">
          <Link to="/auth/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to sign in
          </Link>
        </CardFooter>
      )}
    </PasswordResetFrame>
  )
}
