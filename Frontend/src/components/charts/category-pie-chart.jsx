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
      <CardContent className="flex justify-center pb-5 pt-2">
        <ChartContainer
          config={chartConfig}
          style={{ height }}
          className="mx-auto aspect-square w-full max-w-[270px] shrink-0"
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
              innerRadius="58%"
              outerRadius="88%"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.category}
                  fill={entry.fill ?? `var(--chart-${(index % 5) + 1})`}
                />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
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
                          {centerValue}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 22}
                          className="fill-muted-foreground text-xs"
                        >
                          {centerCaption}
                        </tspan>
                      </text>
                    )
                  }
                  return null
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
