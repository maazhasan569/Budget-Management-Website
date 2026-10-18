import { DashboardPage as DashboardContent } from "@/components/dashboard/dashboard-page"
import { ExpensesPage as ExpensesContent } from "@/components/expenses/expenses-page"
import { GoalsPage as GoalsContent } from "@/components/goals/goals-page"
import { LoansPage as LoansContent } from "@/components/loans/loans-page"
import { FinancialTasksPage as FinancialTasksContent } from "@/components/tasks/tasks-page"
import { HistoryPageContent } from "@/components/history/history-page"
import { SettingsContent } from "@/components/settings/settings-page"

export function DashboardPage() {
  return <DashboardContent />
}

export function ExpensesPage() {
  return <ExpensesContent />
}

export function LoansPage() {
  return <LoansContent />
}

export function GoalsPage() {
  return <GoalsContent />
}

export function FinancialTasksPage() {
  return <FinancialTasksContent />
}

export function SettingsPage() {
  return <SettingsContent />
}

export function HistoryPage() {
  return <HistoryPageContent />
}
