"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";

type MonthlyUsageData = {
  month: string;
  feedback360: number;
  iq: number;
  eq: number;
  psych: number;
}[];

export function MonthlyUsageChart({ data }: { data: MonthlyUsageData }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="month"
          stroke="#ffffff40"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          dy={10}
        />
        <YAxis
          stroke="#ffffff40"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}`}
        />
        <Tooltip
          contentStyle={{ backgroundColor: "#1A1A1E", borderColor: "#ffffff20", borderRadius: 8 }}
          itemStyle={{ color: "#fff" }}
          cursor={{ fill: "#ffffff05" }}
        />
        <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
        <Bar dataKey="feedback360" name="360 Feedback" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
        <Bar dataKey="iq" name="IQ" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
        <Bar dataKey="eq" name="EQ" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
        <Bar dataKey="psych" name="Personality" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
