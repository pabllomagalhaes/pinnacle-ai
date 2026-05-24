"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";

interface ChartData {
  name: string;
  hours: number;
}

export function FocusChart({ data }: { data: ChartData[] }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="h-[200px] w-full bg-muted/20 animate-pulse rounded-lg" />;
  }

  return (
    <div className="h-[200px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
          <XAxis 
            dataKey="name" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            stroke="hsl(var(--muted-foreground))" 
          />
          <YAxis 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            stroke="hsl(var(--muted-foreground))" 
            tickFormatter={(value) => `${value}h`}
          />
          <Tooltip 
            formatter={(value) => [`${value}h`, "Tempo de Foco"]}
            contentStyle={{ 
              background: "hsl(var(--card))", 
              borderColor: "hsl(var(--border))", 
              borderRadius: "8px",
              color: "hsl(var(--foreground))"
            }}
          />
          <Bar 
            dataKey="hours" 
            radius={[4, 4, 0, 0]} 
            className="fill-primary" 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}