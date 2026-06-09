"use client";

import { Activity } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TimelineEntry } from "@/types";

interface ContributionTimelineCardProps {
  timeline: TimelineEntry[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3 shadow-[var(--shadow-elevated)]">
      <p className="text-xs font-bold text-[var(--text-primary)] mb-1.5">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-xs text-[var(--text-secondary)]">
          <span className="capitalize">{entry.name}: </span>
          <span className="font-bold text-[var(--accent-from)]">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

export function ContributionTimelineCard({ timeline }: ContributionTimelineCardProps) {
  const chartData = timeline.map((entry) => ({
    ...entry,
    shortMonth: entry.month.split(" ")[0],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity size={16} className="text-[var(--accent-from)]" />
          Contribution Timeline
        </CardTitle>
        <p className="text-xs text-[var(--text-muted)]">
          Commit activity across {timeline.length} months
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="commitsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e2b714" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#e2b714" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="shortMonth"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="commits"
                stroke="#e2b714"
                strokeWidth={2.5}
                fill="url(#commitsGradient)"
                dot={false}
                activeDot={{ r: 5, fill: "#e2b714", stroke: "var(--bg-surface)", strokeWidth: 2 }}
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
