import { DashboardPage as DashboardContent } from "@/components/dashboard/dashboard-page"
import { ExpensesPage as ExpensesContent } from "@/components/expenses/expenses-page"
import { GoalsPage as GoalsContent } from "@/components/goals/goals-page"
import { LoansPage as LoansContent } from "@/components/loans/loans-page"
import { FinancialTasksPage as FinancialTasksContent } from "@/components/tasks/tasks-page"
import { SectionPlaceholder } from "@/components/layout/section-placeholder"

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
  return (
    <SectionPlaceholder
      title="Settings"
      description="Personalize your Finch experience. This page is still taking shape."
      comingSoon
    />
  )
}

export function HistoryPage() {
  return (
    <SectionPlaceholder
      title="History"
      description="A timeline of your financial activity will be available here."
      comingSoon
    />
  )
}
