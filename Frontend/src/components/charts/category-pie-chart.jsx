

import { Label, Pie, PieChart } from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export function CategoryPieChart({
  data,
  width = "100%",
  height = 250,
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
          color: `hsl(var(--chart-${index + 1}))`,
        },
      ])
    ),
  }

  return (
    <Card style={{ width }}>
      <CardContent className="pt-6">
        <ChartContainer
          config={chartConfig}
          style={{ height }}
          className="mx-auto aspect-square"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />

            <Pie
              data={data}
              dataKey="amount"
              nameKey="category"
              innerRadius={60}
              strokeWidth={5}
              label={({ payload }) =>
                chartConfig[payload.category]?.label
              }
              labelLine={false}
            >
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
                          ${total.toLocaleString()}
                        </tspan>

                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 22}
                          className="fill-muted-foreground text-xs"
                        >
                          Total spent
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