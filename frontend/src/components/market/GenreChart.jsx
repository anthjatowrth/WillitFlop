/**
 * GenreChart — "Genre Market Share" horizontal bar chart (col-span-6)
 * Uses recharts BarChart layout="vertical" with per-bar Cell colors.
 * Colors come from CSS variables defined in index.css.
 */
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { genreData } from '../../data/marketStats'

/** Custom label rendered to the right of each bar */
const BarLabel = ({ x, y, width, height, value, index }) => {
  const color = genreData[index]?.labelColor ?? 'var(--wif-ink)'
  return (
    <text
      x={x + width + 8}
      y={y + height / 2 + 4}
      fill={color}
      fontSize={11}
      fontFamily="Inter"
      fontWeight={700}
    >
      {value}%
    </text>
  )
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div
      className="glass-panel px-3 py-2 text-xs font-inter"
      style={{ backgroundColor: 'var(--wif-ink)', color: 'var(--wif-white)' }}
    >
      <span className="font-bold">{payload[0].payload.name}</span>
      {' — '}{payload[0].value}%
    </div>
  )
}

export default function GenreChart() {
  return (
    <div className="md:col-span-6 bg-surface-container-low p-8 border border-outline-variant/15">
      <h3 className="font-space-grotesk text-xl font-bold mb-8">Genre Market Share</h3>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={genreData}
          layout="vertical"
          margin={{ top: 0, right: 56, left: 0, bottom: 0 }}
          barSize={8}
        >
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            type="category"
            dataKey="name"
            width={175}
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 11,
              fontFamily: 'Inter',
              fontWeight: 700,
              letterSpacing: '0.06em',
              fill: 'var(--wif-ink)',
            }}
          />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Bar dataKey="share" radius={0} label={<BarLabel />} background={{ fill: 'var(--wif-border)', opacity: 0.4 }}>
            {genreData.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
