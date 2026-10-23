import { Navigate, Route, Routes } from "react-router-dom"

import { AuthRouteGuard } from "@/components/auth/auth-route-guard"
import { AuthRoutePage } from "@/components/auth/auth-route-page"
import { LandingPage } from "@/components/landing/landing-page"
import { AppShell } from "@/components/layout/app-shell"
import {
  DashboardPage,
  ExpensesPage,
  FinancialTasksPage,
  GoalsPage,
  HistoryPage,
  LoansPage,
  SettingsPage,
} from "@/components/layout/section-pages"
import { QuestionsPage } from "@/components/questions/question"

function App() {
  return (
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
  )
}

export default App
