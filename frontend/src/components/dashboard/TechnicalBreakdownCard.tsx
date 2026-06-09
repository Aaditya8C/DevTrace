"use client";

import { BarChart3 } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TechnicalBreakdownItem } from "@/types";

// Achievement-palette colors for chart
const CHART_COLORS: Record<string, string> = {
  Frontend: "#e2b714",   // Monkeytype yellow
  Backend: "#7cb342",    // success green
  Testing: "#526248",    // dark olive green
  DevOps: "#4a4e52",     // slate gray
  Documentation: "#646669", // secondary gray
  Other: "#3a3d41",      // elevated surface
};

interface TechnicalBreakdownCardProps {
  breakdown: TechnicalBreakdownItem[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: TechnicalBreakdownItem }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3 shadow-[var(--shadow-elevated)]">
      <p className="text-sm font-bold text-[var(--text-primary)] mb-1">{item.area}</p>
      <p className="text-xs text-[var(--text-secondary)]">{item.percentage}% of contributions</p>
      <p className="text-xs text-[var(--text-muted)]">{item.commits} commits · {item.filesChanged} files</p>
    </div>
  );
}

export function TechnicalBreakdownCard({ breakdown }: TechnicalBreakdownCardProps) {
  const coloredBreakdown = breakdown.map((item) => ({
    ...item,
    color: CHART_COLORS[item.area] ?? "#94a3b8",
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 size={16} className="text-[var(--accent-from)]" />
          Technical Breakdown
        </CardTitle>
        <p className="text-xs text-[var(--text-muted)]">
          Contribution distribution by area
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={coloredBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={85}
                paddingAngle={3}
                dataKey="percentage"
                nameKey="area"
                animationBegin={200}
                animationDuration={900}
              >
                {coloredBreakdown.map((entry) => (
                  <Cell key={entry.area} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
          {coloredBreakdown.map((item) => (
            <div key={item.area} className="flex items-center gap-2 rounded-lg bg-[var(--bg-surface)] px-2.5 py-1.5">
              <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--text-secondary)] truncate">{item.area}</p>
                <p className="text-xs font-bold" style={{ color: item.color }}>{item.percentage}%</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
