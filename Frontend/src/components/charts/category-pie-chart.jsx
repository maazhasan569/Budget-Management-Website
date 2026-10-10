import { Cell, Label, Pie, PieChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export function CategoryPieChart({
  data,
  width = "100%",
  height = 210,
  title,
  description,
  centerValue,
  centerCaption,
}) {
  const total = data.reduce((sum, item) => sum + item.amount, 0)

  const chartConfig = {
    amount: {
      label: "Amount",
    },
    ...Object.fromEntries(
      data.map((item, index) => [
        item.category,
        {
          label: item.category,
          color: item.fill ?? `var(--chart-${(index % 5) + 1})`,
        },
      ])
    ),
  }

  return (
    <Card style={{ width }}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="flex flex-col items-center gap-4 pb-5 pt-2">
        <ChartContainer
          config={chartConfig}
          style={{ height }}
          className="mx-auto aspect-square w-full max-w-[210px] shrink-0"
        >
          <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />

            <Pie
              data={data}
              dataKey="amount"
              nameKey="category"
              innerRadius={52}
              outerRadius={76}
              strokeWidth={5}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.category}
                  fill={entry.fill ?? `var(--chart-${(index % 5) + 1})`}
                />
              ))}

              <Label
                content={({ viewBox }) => {
                  if (
                    viewBox &&
                    "cx" in viewBox &&
                    "cy" in viewBox
                  ) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {centerValue ?? `$${total.toLocaleString()}`}
                        </tspan>

                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 22}
                          className="fill-muted-foreground text-xs"
                        >
                          {centerCaption ?? "Total spent"}
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        <ul aria-label="Expense categories" className="grid max-h-48 w-full grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {data.map((entry, index) => (
            <li key={entry.category} className="flex min-w-0 items-start gap-2 rounded-lg bg-muted/35 px-3 py-2 text-sm">
              <span
                aria-hidden="true"
                className="mt-1.5 size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: entry.fill ?? `var(--chart-${(index % 5) + 1})` }}
              />
              <span className="min-w-0 break-words">{entry.category}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
