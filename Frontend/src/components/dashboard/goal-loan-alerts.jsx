import { AlertTriangle, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const alerts = [
  { id: "1", type: "loan", name: "Car loan installment", amount: 420, daysUntilDue: 2 },
  { id: "2", type: "goal", name: "Emergency fund contribution", amount: 300, daysUntilDue: 5 },
  { id: "3", type: "loan", name: "Personal loan installment", amount: 180, daysUntilDue: -1 },
]

function urgency(days) {
  if (days < 0) return { label: "Overdue", variant: "destructive" }
  if (days <= 3) return { label: `Due in ${days}d`, variant: "destructive" }
  if (days <= 7) return { label: `Due in ${days}d`, variant: "warning" }
  return { label: `Due in ${days}d`, variant: "secondary" }
}

export function GoalLoanAlerts() {
  const sorted = [...alerts].sort((a, b) => a.daysUntilDue - b.daysUntilDue)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-4 w-4" /> Goal &amp; loan alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.length === 0 && (
          <p className="text-sm text-muted-foreground">You're all caught up — nothing due soon.</p>
        )}
        {sorted.map((item) => {
          const u = urgency(item.daysUntilDue)
          return (
            <div
              key={item.id}
              className={cn(
                "flex items-center justify-between rounded-lg border p-3",
                item.daysUntilDue < 0 && "border-destructive/40 bg-destructive/10"
              )}
            >
              <div className="flex items-center gap-3">
                {item.daysUntilDue < 0 && <AlertTriangle className="h-4 w-4 text-destructive" />}
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.type === "loan" ? "Loan" : "Goal"} · ${item.amount}
                  </p>
                </div>
              </div>
              <Badge
                variant={u.variant === "warning" ? "outline" : u.variant}
                className={u.variant === "warning" ? "border-warning text-warning" : ""}
              >
                {u.label}
              </Badge>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}