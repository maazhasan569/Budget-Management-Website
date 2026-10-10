// src/components/charts/spending-trend-chart.jsx
import { TrendingUp, TrendingDown } from "lucide-react"
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  spent: {
    label: "Spent",
    color: "var(--primary)",
  },
}

export function SpendingTrendChart({ data, trendPercent, periodLabel = "month" }) {
  const isUp = trendPercent >= 0
  const hasSinglePoint = data.length === 1 && Number.isFinite(Number(data[0]?.spent))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[220px] w-full">
          <LineChart data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            {hasSinglePoint && (
              <ReferenceLine
                y={Number(data[0].spent)}
                stroke="var(--color-spent)"
                strokeWidth={2}
              />
            )}
            <Line
              dataKey="spent"
              type="monotone"
              stroke="var(--color-spent)"
              strokeWidth={2}
              dot={hasSinglePoint ? { r: 4, fill: "var(--color-spent)", strokeWidth: 0 } : false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        {hasSinglePoint ? (
          <p className="font-medium text-muted-foreground">
            One spending day recorded — the line marks that day’s total.
          </p>
        ) : trendPercent == null ? (
          <p className="font-medium text-muted-foreground">Spending totals by {periodLabel}</p>
        ) : trendPercent === 0 ? (
          <p className="flex items-center gap-2 font-medium leading-none">Spending is steady vs. the previous {periodLabel}</p>
        ) : (
          <div className="flex gap-2 font-medium leading-none">
            {isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            Spending {isUp ? "increased" : "decreased"} by {Math.abs(trendPercent)}% vs. the previous {periodLabel}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
