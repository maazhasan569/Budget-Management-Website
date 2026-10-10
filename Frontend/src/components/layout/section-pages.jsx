import { DashboardPage as DashboardContent } from "@/components/dashboard/dashboard-page"
import { ExpensesPage as ExpensesContent } from "@/components/expenses/expenses-page"
import { SectionPlaceholder } from "@/components/layout/section-placeholder"

export function DashboardPage() {
  return <DashboardContent />
}

export function ExpensesPage() {
  return <ExpensesContent />
}

export function LoansPage() {
  return <SectionPlaceholder title="Loans" description="Track what you owe and make a plan to pay it down." />
}

export function GoalsPage() {
  return <SectionPlaceholder title="Goals" description="Turn the things you are saving for into steady progress." />
}

export function FinancialTasksPage() {
  return <SectionPlaceholder title="Financial Tasks" description="Keep important money-related tasks and documents together." />
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
