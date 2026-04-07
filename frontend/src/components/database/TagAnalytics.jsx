/**
 * TagAnalytics — section analytics de GameDatabasePage
 * Suit le parcours MiniGame : famille → ambiance → gameplay → visuel → caméra → mode
 *
 * Design :
 *  - Barres horizontales = volume (count)
 *  - Cercle coloré en bout de barre = % de succès (vert / orange / rouge)
 *  - Zéro animation, zéro mouvement au hover
 */
import {
  ComposedChart, Bar, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useTagAnalytics } from '../../hooks/useTagAnalytics'

// ── Helpers ───────────────────────────────────────────────────────────
const fmt = n => (typeof n === 'number' ? n.toLocaleString('fr-FR') : n)

function rateColor(rate) {
  if (rate >= 50) return '#007A4C'
  if (rate >= 35) return '#E67E22'
  return '#CC1A1A'
}

// ── Tooltip stable (ne déclenche aucun changement visuel) ─────────────
function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div
      className="px-3 py-2.5 shadow-xl"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', minWidth: 160 }}
    >
      <p className="font-label text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
        {d.fullName || d.name}
      </p>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-4">
          <span className="font-inter text-xs text-muted-foreground">Volume</span>
          <span className="font-space-grotesk text-sm font-bold text-foreground">
            {fmt(d.count)} jeux
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="font-inter text-xs text-muted-foreground">Succès</span>
          <span
            className="font-space-grotesk text-sm font-bold"
            style={{ color: rateColor(d.successRate) }}
          >
            {d.successRate} %
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Dot custom pour la ligne % succès (figé au hover) ─────────────────
function RateDot(props) {
  const { cx, cy, payload } = props
  if (!cx || !cy || payload?.successRate == null) return null
  const rate  = payload.successRate
  const color = rateColor(rate)
  const label = `${rate}%`
  const r = 11
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={color} />
      <text
        x={cx} y={cy + 4}
        textAnchor="middle"
        style={{ fontSize: 9, fontWeight: 800, fill: '#fff', fontFamily: 'Space Grotesk' }}
      >
        {label}
      </text>
    </g>
  )
}

// ── Carte chart ───────────────────────────────────────────────────────
export function ChartCard({ step, title, subtitle, data, color }) {
  if (!data || data.length === 0) return null

  // Axe count : arrondi au millier supérieur pour un axe propre
  const maxCount = Math.max(...data.map(d => d.count))
  const countDomain = [0, Math.ceil(maxCount / 500) * 500]

  const chartH = data.length * 44 + 20

  return (
    <div
      className="bg-card border border-border/30 p-5"
      style={{ borderTop: `3px solid ${color}` }}
    >
      {/* En-tête question */}
      <div className="mb-4">
        <span
          className="font-label text-[10px] tracking-[0.25em] uppercase"
          style={{ color }}
        >
          {step}
        </span>
        <h3 className="font-headline font-black tracking-tight text-xl text-foreground leading-tight mt-0.5">
          {title}
        </h3>
        <p className="font-inter text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={chartH}>
        <ComposedChart
          layout="vertical"
          data={data}
          margin={{ top: 4, right: 36, left: 4, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            horizontal={false}
          />

          {/* Axe X bas — count */}
          <XAxis
            xAxisId="count"
            type="number"
            orientation="bottom"
            domain={countDomain}
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            tickFormatter={v => fmt(v)}
            axisLine={false}
            tickLine={false}
          />

          {/* Axe X haut — % succès (invisible, sert au positionnement du dot) */}
          <XAxis
            xAxisId="rate"
            type="number"
            domain={[0, 100]}
            orientation="top"
            hide
          />

          {/* Axe Y — noms */}
          <YAxis
            type="category"
            dataKey="name"
            width={128}
            tick={{ fontSize: 11, fill: 'var(--foreground)', fontFamily: 'Inter' }}
            axisLine={false}
            tickLine={false}
          />

          {/* Tooltip — cursor=false : aucune ligne ni highlight */}
          <Tooltip content={<ChartTooltip />} cursor={false} />

          {/* Barres volume — activeBar identique à la normale = pas de changement */}
          <Bar
            xAxisId="count"
            dataKey="count"
            radius={[0, 4, 4, 0]}
            maxBarSize={20}
            isAnimationActive={false}
            activeBar={false}
          >
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={color}
                fillOpacity={Math.max(0.45, 1 - i * 0.04)}
              />
            ))}
          </Bar>

          {/* Ligne % succès — uniquement des dots, pas de trait */}
          <Line
            xAxisId="rate"
            type="linear"
            dataKey="successRate"
            stroke="transparent"
            strokeWidth={0}
            dot={<RateDot />}
            activeDot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-card border border-border/30 animate-pulse"
          style={{ height: 320 }}
        />
      ))}
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────
export default function TagAnalytics() {
  const { data, loading, error } = useTagAnalytics()

  if (loading) return <Skeleton />
  if (error) return (
    <div className="p-4 border border-destructive/30 bg-card">
      <p className="font-inter text-xs text-destructive">Erreur : {error}</p>
    </div>
  )
  if (!data) return null

  const CHARTS = [
    {
      step:     'Question 1 / 6',
      title:    'Famille de ton jeu',
      subtitle: 'Genres Steam (volume et taux de succès)',
      data:     data.genre,
      color:    '#E8005A',
    },
    {
      step:     'Question 2 / 6',
      title:    'Ambiance de ton univers',
      subtitle: 'Tags d\'univers (volume et taux de succès)',
      data:     data.ambiance,
      color:    '#9B59B6',
    },
    {
      step:     'Question 3 / 6',
      title:    'Comment joue-t-on ?',
      subtitle: 'Mécaniques & gameplay (volume et taux de succès)',
      data:     data.gameplay,
      color:    '#007A8C',
    },
    {
      step:     'Question 4 / 6',
      title:    'Style graphique',
      subtitle: 'Tags visuels (volume et taux de succès)',
      data:     data.visual,
      color:    '#E67E22',
    },
    {
      step:     'Question 5 / 6',
      title:    'Vue caméra principale',
      subtitle: 'Tags perspective (volume et taux de succès)',
      data:     data.camera,
      color:    '#4A90E2',
    },
    {
      step:     'Question 6 / 6',
      title:    'Mode de jeu',
      subtitle: 'Catégories Steam (volume et taux de succès)',
      data:     data.playmode,
      color:    '#007A4C',
    },
  ]

  return (
    <div>
      {/* Légende */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6">
        <div className="flex items-center gap-4 font-label text-[10px] tracking-wider uppercase">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: '#007A4C' }} />
            <span className="text-muted-foreground">≥ 50 % succès</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: '#E67E22' }} />
            <span className="text-muted-foreground">35 – 49 %</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: '#CC1A1A' }} />
            <span className="text-muted-foreground">{'< 35 %'}</span>
          </div>
        </div>
        <span className="font-label text-[10px] tracking-wider uppercase text-muted-foreground/50">
          Barres = volume / Cercles = % succès / {fmt(data.sampleSize)} jeux analysés
        </span>
      </div>

      {/* Grille 2 colonnes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {CHARTS.map(c => (
          <ChartCard
            key={c.step}
            step={c.step}
            title={c.title}
            subtitle={c.subtitle}
            data={c.data}
            color={c.color}
          />
        ))}
      </div>
    </div>
  )
}
