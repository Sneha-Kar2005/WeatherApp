import { useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "rgba(15,18,38,0.9)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 10,
        padding: "8px 12px",
        color: "#fff",
        fontSize: 13,
      }}
    >
      <div style={{ opacity: 0.7, marginBottom: 4 }}>{label}</div>
      <div>{Math.round(payload[0]?.value)}&deg;C</div>
      <div style={{ opacity: 0.7 }}>{payload[1]?.value ?? 0}% rain chance</div>
    </div>
  );
}

export default function HourlyChart({ hourly, hoursAhead = 24 }) {
  const [now] = useState(() => Date.now());

  if (!hourly || !hourly.time) return null;

  const startIdx = hourly.time.findIndex((t) => new Date(t).getTime() >= now);
  const from = startIdx >= 0 ? startIdx : 0;

  const data = hourly.time.slice(from, from + hoursAhead).map((t, i) => {
    const idx = from + i;
    return {
      label: new Date(t).toLocaleTimeString(undefined, { hour: "numeric" }),
      temp: hourly.temperature_2m[idx],
      pop: hourly.precipitation_probability?.[idx] ?? 0,
    };
  });

  return (
    <Card className="fade-in" sx={{ maxWidth: 760, mx: "auto" }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
          Next {hoursAhead} hours
        </Typography>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6dd5fa" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#6dd5fa" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis
              dataKey="label"
              stroke="rgba(255,255,255,0.5)"
              tick={{ fontSize: 11 }}
              interval={Math.ceil(hoursAhead / 8)}
            />
            <YAxis
              yAxisId="temp"
              stroke="rgba(255,255,255,0.5)"
              tick={{ fontSize: 11 }}
              width={36}
              allowDecimals={false}
              tickFormatter={(v) => `${Math.round(v)}°`}
              domain={["dataMin - 2", "dataMax + 2"]}
            />
            <YAxis yAxisId="pop" orientation="right" hide domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Bar yAxisId="pop" dataKey="pop" fill="rgba(109,213,250,0.25)" radius={[4, 4, 0, 0]} barSize={10} />
            <Area
              yAxisId="temp"
              type="monotone"
              dataKey="temp"
              stroke="#6dd5fa"
              strokeWidth={2}
              fill="url(#tempFill)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
