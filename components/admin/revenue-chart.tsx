'use client'

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'

interface RevenueChartProps {
  data: {
    month: string
    revenue: number
    commissions: number
  }[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  if (data.every(d => d.revenue === 0)) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        <p>No data yet. Entries will appear here once added.</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis 
          dataKey="month" 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
          formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
        />
        <Bar 
          dataKey="revenue" 
          fill="hsl(var(--primary))" 
          radius={[4, 4, 0, 0]}
          name="Revenue"
        />
        <Bar 
          dataKey="commissions" 
          fill="hsl(var(--chart-2))" 
          radius={[4, 4, 0, 0]}
          name="Commissions"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
