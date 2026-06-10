"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: {
    o: number;
    c: number;
    e: number;
    a: number;
    n: number;
  };
}

export function OceanRadarChart({ data }: Props) {
  const chartData = [
    { subject: "Openness", A: data.o, fullMark: 100 },
    { subject: "Conscientiousness", A: data.c, fullMark: 100 },
    { subject: "Extraversion", A: data.e, fullMark: 100 },
    { subject: "Agreeableness", A: data.a, fullMark: 100 },
    { subject: "Neuroticism", A: data.n, fullMark: 100 },
  ];

  return (
    <div className="h-[200px] w-full mt-4 flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }} 
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            tick={false} 
            axisLine={false} 
          />
          <Radar
            name="Team"
            dataKey="A"
            stroke="#06b6d4" // cyan-500
            fill="#06b6d4"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
