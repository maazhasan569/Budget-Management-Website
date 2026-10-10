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
  height = 250,
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
      data.map((item) => [
        item.category,
        {
          label: item.category,
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
      <CardContent className="pt-6">
        <ChartContainer
          config={chartConfig}
          style={{ height }}
          className="mx-auto aspect-square"
        >
          <PieChart  margin={{ top: 24, right: 40, bottom: 24, left: 40 }}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />

            <Pie
              data={data}
              dataKey="amount"
              nameKey="category"
              innerRadius={60}
              outerRadius={85}
              strokeWidth={5}
              label={({ payload }) => chartConfig[payload.category]?.label}
              labelLine={false}
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
      </CardContent>
    </Card>
  )
}
