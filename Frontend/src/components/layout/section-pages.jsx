import { useNavigate, useParams } from "react-router-dom"

import { getExpenseById } from "@/api/expenses/expenses"
import { getGoalById } from "@/api/goals/goals"
import { getLoanById } from "@/api/loans/loans"
import { getTaskById } from "@/api/tasks/tasks"
import { DashboardPage as DashboardContent } from "@/components/dashboard/dashboard-page"
import { ExpensesPage as ExpensesContent } from "@/components/expenses/expenses-page"
import { GoalsPage as GoalsContent } from "@/components/goals/goals-page"
import { LoansPage as LoansContent } from "@/components/loans/loans-page"
import { FinancialTasksPage as FinancialTasksContent } from "@/components/tasks/tasks-page"
import { HistoryPageContent } from "@/components/history/history-page"
import { RecordRouteDialog } from "@/components/records/record-route-dialog"
import { SettingsContent } from "@/components/settings/settings-page"

function RecordPage({ Content, param, type, getRecord, basePath }) {
  const params = useParams()
  const navigate = useNavigate()
  const id = params[param]

  return (
    <>
      <Content />
      {id && (
        <RecordRouteDialog
          id={id}
          type={type}
          getRecord={getRecord}
          onClose={() => navigate(basePath)}
        />
      )}
    </>
  )
}

export function DashboardPage() {
  return <DashboardContent />
}

export function ExpensesPage() {
  return <RecordPage Content={ExpensesContent} param="expenseId" type="expenses" getRecord={getExpenseById} basePath="/expenses" />
}

export function LoansPage() {
  return <RecordPage Content={LoansContent} param="loanId" type="loans" getRecord={getLoanById} basePath="/loans" />
}

export function GoalsPage() {
  return <RecordPage Content={GoalsContent} param="goalId" type="goals" getRecord={getGoalById} basePath="/goals" />
}

export function FinancialTasksPage() {
  return <RecordPage Content={FinancialTasksContent} param="taskId" type="tasks" getRecord={getTaskById} basePath="/financial-tasks" />
}

export function SettingsPage() {
  return <SettingsContent />
}

export function HistoryPage() {
  return <HistoryPageContent />
}
