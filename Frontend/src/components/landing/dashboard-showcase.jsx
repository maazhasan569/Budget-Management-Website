import { SpendingTrendChart } from "@/components/charts/spending-trend-chart"
import { CategoryPieChart } from "@/components/charts/category-pie-chart"
import { GoalLoanAlerts } from "@/components/dashboard/goal-loan-alerts"

export function DashboardShowcase() {
    return (
        <section id="showcase" className="mx-auto max-w-6xl px-6 py-16">
            <div className="mb-10 max-w-xl">
                <p className="mb-2 text-sm font-semibold text-primary">The dashboard</p>
                <h2 className="font-serif text-3xl font-semibold tracking-tight">
                    Everything your money is doing, on one screen
                </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2"><SpendingTrendChart data={[
                    { date: "Oct 1", spent: 120 },
                    { date: "Oct 5", spent: 340 },
                    { date: "Oct 10", spent: 410 },
                    { date: "Oct 15", spent: 560 },
                    { date: "Oct 20", spent: 640 },
                    { date: "Oct 25", spent: 780 },
                ]} trendPercent={50} /></div>
                <CategoryPieChart data={[
                    { category: "food", amount: 340, fill: "var(--color-food)" },
                    { category: "bills", amount: 260, fill: "var(--color-bills)" },
                    { category: "transport", amount: 220, fill: "var(--color-transport)" },
                    { category: "other", amount: 180, fill: "var(--color-other)" },
                ]} />
                <div className="md:col-span-3"><GoalLoanAlerts /></div>
            </div>
        </section>
    )
}