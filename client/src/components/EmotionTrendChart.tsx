import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface EmotionTrendPoint {
  date: string;
  score: number;
  type?: string;
}

interface EmotionTrendChartProps {
  data: EmotionTrendPoint[];
  scoreLabel?: string;
  emptyLabel?: string;
}

function TrendDot(props: { cx?: number; cy?: number; payload?: EmotionTrendPoint }) {
  const { cx = 0, cy = 0, payload } = props;
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill="#FFD580" opacity={0.16} />
      <circle cx={cx} cy={cy} r={4} fill="#FFD580" stroke="#0B0F2F" strokeWidth={2} />
      {payload?.score !== undefined && (
        <text x={cx} y={cy - 13} textAnchor="middle" fill="#FFF4D6" fontSize={11} fontWeight={700}>
          {payload.score}
        </text>
      )}
    </g>
  );
}

export default function EmotionTrendChart({ data, scoreLabel = "评分", emptyLabel = "还没有足够的数据来显示趋势" }: EmotionTrendChartProps) {
  if (!data.length) {
    return <div className="flex h-64 items-center justify-center text-sm text-white/50" data-testid="emotion-trend-empty">{emptyLabel}</div>;
  }

  return (
    <div className="h-[300px] w-full" data-testid="emotion-trend-chart" aria-label="7天情绪趋势折线图">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 28, right: 12, left: -12, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#9CA3AF"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(date) => {
              const parsed = new Date(date);
              return `${parsed.getMonth() + 1}/${parsed.getDate()}`;
            }}
          />
          <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} domain={[0, 100]} width={34} />
          <Tooltip
            cursor={{ stroke: "#FFD580", strokeOpacity: 0.22 }}
            contentStyle={{ backgroundColor: "#1C1F4A", border: "1px solid #FFD580", borderRadius: "10px", color: "#FFF" }}
            labelStyle={{ color: "#FFD580" }}
            formatter={(value: unknown) => [typeof value === "number" ? value : 0, scoreLabel]}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#FFD580"
            strokeWidth={3}
            dot={<TrendDot />}
            activeDot={{ r: 7, fill: "#FFF4D6", stroke: "#FFD580", strokeWidth: 3 }}
            isAnimationActive
            animationDuration={650}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
