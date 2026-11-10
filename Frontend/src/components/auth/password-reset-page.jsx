import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowLeft, Loader2, Mail } from "lucide-react"

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
    <main className="site-page-enter relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 size-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute left-[18%] top-[20%] size-40 rounded-full bg-success/5 blur-3xl" />
      </div>
      <Card className="relative w-full max-w-sm border-border/80 bg-card/95 text-card-foreground shadow-xl shadow-primary/5 backdrop-blur">
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
          <motion.div
            className="grid justify-items-center gap-3 rounded-xl border border-success/20 bg-success/5 p-5 text-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
              <Mail className="size-5" aria-hidden="true" />
            </span>
            <p role="status" aria-live="polite" className="text-sm leading-relaxed text-foreground">
              We’ve sent a password reset email to <span className="font-medium">{email.trim()}</span>.
              Open the link in that email to choose a new password.
            </p>
            <p className="text-xs text-muted-foreground">
              The link expires in 15 minutes. If it’s not in your inbox, check your spam folder.
            </p>
            <Button type="button" variant="outline" onClick={() => setSent(false)}>
              Try another email
            </Button>
          </motion.div>
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
            <Button type="submit" className="w-full" disabled={submitting} aria-label={submitting ? "Sending reset link" : undefined} aria-busy={submitting}>
              {submitting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
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
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")?.trim() ?? ""
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [updated, setUpdated] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!updated) return undefined

    const redirectTimer = window.setTimeout(
      () => navigate("/auth/login", {
        replace: true,
        state: { passwordResetSuccess: true },
      }),
      reduceMotion ? 1200 : 2400,
    )

    return () => window.clearTimeout(redirectTimer)
  }, [navigate, reduceMotion, updated])

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
          <motion.div
            role="status"
            aria-live="polite"
            className="grid justify-items-center gap-4 rounded-xl border border-success/20 bg-success/5 p-6 text-center"
            initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <motion.span
              className="relative flex size-16 items-center justify-center rounded-full bg-success/10 text-success"
              initial={reduceMotion ? false : { scale: 0.7 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 15, delay: 0.08 }}
            >
              <motion.span
                className="absolute inset-0 rounded-full border border-success/30"
                initial={reduceMotion ? false : { scale: 0.7, opacity: 0 }}
                animate={{ scale: 1.35, opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.18 }}
                aria-hidden="true"
              />
              <svg viewBox="0 0 24 24" className="size-8" fill="none" aria-hidden="true">
                <motion.path
                  d="m5 12.5 4.5 4.5L19 7"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={reduceMotion ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.45, ease: "easeOut", delay: 0.2 }}
                />
              </svg>
            </motion.span>
            <div className="space-y-1">
              <p className="font-medium text-foreground">Your password has been updated.</p>
              <div role="status" aria-label="Returning to sign in" className="flex justify-center py-1">
                <Loader2 className="size-4 animate-spin text-primary" aria-hidden="true" />
              </div>
            </div>
            <Button
              type="button"
              className="w-full"
              onClick={() => navigate("/auth/login", {
                replace: true,
                state: { passwordResetSuccess: true },
              })}
            >
              Continue to sign in
            </Button>
          </motion.div>
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
            <Button type="submit" className="w-full" disabled={submitting || !token} aria-label={submitting ? "Updating password" : undefined} aria-busy={submitting}>
              {submitting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
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
