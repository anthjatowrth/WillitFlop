/**
 * MarketGrowthChart — "Market Growth Velocity" line chart (col-span-8)
 * Uses recharts (already installed). Colors via CSS variables.
 */
import {
  LineChart,
  Line,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { marketGrowthData } from '../../data/marketStats'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div
      className="glass-panel px-3 py-2 text-xs font-inter"
      style={{ backgroundColor: 'var(--wif-ink)', color: 'var(--wif-white)' }}
    >
      <div className="font-bold mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.stroke }}>
          {p.dataKey === 'predicted' ? '2024 Predicted' : '2023 Actual'}: {p.value}
        </div>
      ))}
    </div>
  )
}

export default function MarketGrowthChart() {
  return (
    <div className="md:col-span-8 bg-surface-container-low p-8 border border-outline-variant/15">
      {/* Header row */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="font-space-grotesk text-xl font-bold">Market Growth Velocity</h3>
        <div className="flex gap-4">
          <span className="flex items-center gap-2 font-inter text-[10px] uppercase font-bold text-primary">
            <span className="w-2 h-2 bg-primary inline-block" />
            2024 Predicted
          </span>
          <span className="flex items-center gap-2 font-inter text-[10px] uppercase font-bold text-muted-foreground">
            <span className="w-2 h-2 bg-muted-foreground inline-block" />
            2023 Actual
          </span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={marketGrowthData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="4 4"
            stroke="var(--wif-border)"
            opacity={0.3}
            vertical={false}
          />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 10,
              fontFamily: 'Inter',
              fontWeight: 700,
              letterSpacing: '0.1em',
              fill: 'var(--wif-gray)',
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="var(--wif-pink)"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, fill: 'var(--wif-pink)', strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="var(--wif-gray)"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            activeDot={{ r: 4, fill: 'var(--wif-gray)', strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
