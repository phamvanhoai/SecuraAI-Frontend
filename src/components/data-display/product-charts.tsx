"use client";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
const colors = ["#1769f6", "#16a05d", "#f59e0b", "#ef4444"];
export function DistributionDonut({
  items,
  total,
}: {
  items: readonly { label: string; value: string }[];
  total: string;
}) {
  const data = items.map((item, index) => ({
    name: item.label,
    value:
      Number.parseFloat(
        item.value.replace(/[^0-9,.]/g, "").replace(",", "."),
      ) || index + 1,
  }));
  return (
    <div
      className="relative h-44 w-full"
      aria-label="Biểu đồ phân bố dữ liệu mẫu"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={48}
            outerRadius={70}
            paddingAngle={1}
            stroke="none"
          >
            {data.map((item, index) => (
              <Cell
                fill={colors[index % colors.length] ?? "#1769f6"}
                key={item.name}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              borderColor: "#dfe6f2",
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
        <div>
          <strong className="text-foreground block text-2xl">{total}</strong>
          <span className="text-muted text-xs">Tổng mẫu</span>
        </div>
      </div>
    </div>
  );
}

const trendData = [
  { day: "01/05", critical: 82, high: 62, medium: 36, low: 14 },
  { day: "06/05", critical: 87, high: 67, medium: 41, low: 18 },
  { day: "11/05", critical: 84, high: 61, medium: 35, low: 14 },
  { day: "16/05", critical: 85, high: 67, medium: 41, low: 18 },
  { day: "21/05", critical: 89, high: 68, medium: 42, low: 18 },
  { day: "26/05", critical: 87, high: 67, medium: 44, low: 19 },
  { day: "31/05", critical: 91, high: 71, medium: 44, low: 19 },
];

export function RiskTrendChart() {
  return (
    <div className="h-64 w-full" aria-label="Biểu đồ xu hướng rủi ro mẫu">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={trendData}
          margin={{ top: 12, right: 12, left: -24, bottom: 0 }}
        >
          <CartesianGrid stroke="#e7edf7" vertical={false} />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#60708f", fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#60708f", fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              borderColor: "#dfe6f2",
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="critical"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ r: 2 }}
          />
          <Line
            type="monotone"
            dataKey="high"
            stroke="#f97316"
            strokeWidth={2}
            dot={{ r: 2 }}
          />
          <Line
            type="monotone"
            dataKey="medium"
            stroke="#eab308"
            strokeWidth={2}
            dot={{ r: 2 }}
          />
          <Line
            type="monotone"
            dataKey="low"
            stroke="#16a05d"
            strokeWidth={2}
            dot={{ r: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
