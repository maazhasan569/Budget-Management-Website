import { AuthCard } from "@/components/auth/auth-card"

export function AuthRoutePage({ initialMode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <AuthCard initialMode={initialMode} />
    </div>
  )
}
