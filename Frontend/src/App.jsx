import { lazy, Suspense } from "react"
import { Navigate, Route, Routes } from "react-router-dom"

import { AuthRouteGuard } from "@/components/auth/auth-route-guard"

const AuthRoutePage = lazy(() => import("@/components/auth/auth-route-page").then((module) => ({ default: module.AuthRoutePage })))
const LandingPage = lazy(() => import("@/components/landing/landing-page").then((module) => ({ default: module.LandingPage })))
const AppShell = lazy(() => import("@/components/layout/app-shell").then((module) => ({ default: module.AppShell })))
const loadSectionPages = () => import("@/components/layout/section-pages")
const DashboardPage = lazy(() => loadSectionPages().then((module) => ({ default: module.DashboardPage })))
const ExpensesPage = lazy(() => loadSectionPages().then((module) => ({ default: module.ExpensesPage })))
const FinancialTasksPage = lazy(() => loadSectionPages().then((module) => ({ default: module.FinancialTasksPage })))
const GoalsPage = lazy(() => loadSectionPages().then((module) => ({ default: module.GoalsPage })))
const HistoryPage = lazy(() => loadSectionPages().then((module) => ({ default: module.HistoryPage })))
const LoansPage = lazy(() => loadSectionPages().then((module) => ({ default: module.LoansPage })))
const SettingsPage = lazy(() => loadSectionPages().then((module) => ({ default: module.SettingsPage })))
const QuestionsPage = lazy(() => import("@/components/questions/question").then((module) => ({ default: module.QuestionsPage })))

function App() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-sm text-muted-foreground">Loading…</div>}>
      <Routes>
        <Route element={<AuthRouteGuard guestOnly />}>
          <Route path="/" element={<LandingPage />} />
        </Route>
        <Route path="/auth/login" element={<AuthRoutePage initialMode="sign-in" />} />
        <Route path="/auth/signup" element={<AuthRoutePage initialMode="sign-up" />} />
        <Route path="/sign-in" element={<Navigate to="/auth/login" replace />} />
        <Route path="/sign-up" element={<Navigate to="/auth/signup" replace />} />
        <Route element={<AuthRouteGuard />}>
          <Route path="/questions" element={<QuestionsPage />} />
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/expenses/:expenseId?" element={<ExpensesPage />} />
            <Route path="/loans/:loanId?" element={<LoansPage />} />
            <Route path="/goals/:goalId?" element={<GoalsPage />} />
            <Route path="/financial-tasks/:taskId?" element={<FinancialTasksPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/history/:recordType?/:recordId?" element={<HistoryPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
