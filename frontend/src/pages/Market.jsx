/**
 * Tendances — /market
 * Dashboard analytique interactif alimenté par Supabase.
 */
import { useState, useCallback } from 'react'
import TagAnalytics from '../components/database/TagAnalytics'
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell, Sector,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Brush, Legend,
  Treemap, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import { useTendances } from '../hooks/useTendances'

// ── Palette ─────────────────────────────────────────────────────────
const C = [
  '#E8005A', '#007A8C', '#00C8B4', '#4A90E2', '#007A4C',
  '#9B59B6', '#E67E22', '#1ABC9C', '#F39C12', '#CC1A1A',
  '#2ECC71', '#D35400', '#16A085', '#8E44AD', '#2980B9',
  '#E74C3C', '#3498DB', '#27AE60', '#F1C40F', '#E91E63',
]

const TABS = [
  { id: 'apercu',  label: 'Vue d\'ensemble',    icon: 'dashboard' },
  { id: 'genres',  label: 'Genres & Catégories', icon: 'category' },
  { id: 'succes',  label: 'Succès & Performance', icon: 'trending_up' },
  { id: 'tags',    label: 'Analyse par tags',    icon: 'bar_chart' },
]

const fmt = n => typeof n === 'number' ? n.toLocaleString('fr-FR') : n

// ── Tooltip custom ───────────────────────────────────────────────────
function Tip({ active, payload, label, unit = '' }) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{ background: 'var(--wif-bg)', border: '1px solid var(--wif-border)' }}
      className="px-4 py-3 shadow-2xl rounded-sm"
    >
      {label !== undefined && label !== '' && (
        <p className="font-inter text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
      )}
      {payload.map((e, i) => (
        <p key={i} className="font-space-grotesk text-sm font-bold" style={{ color: e.color || e.fill }}>
          {e.name !== 'value' && e.name !== 'count' && e.name !== 'successRate' ? `${e.name} : ` : ''}
          {fmt(e.value)}{unit}
        </p>
      ))}
    </div>
  )
}

// ── KPI Card ─────────────────────────────────────────────────────────
function KpiCard({ label, value, icon, color = 'var(--wif-pink)', sub }) {
  return (
    <div
      className="bg-card border border-border/30 p-6 relative overflow-hidden flex flex-col gap-2"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex justify-between items-start">
        <p className="font-inter text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
        <span className="material-symbols-outlined opacity-20 text-3xl">{icon}</span>
      </div>
      <p className="font-space-grotesk text-4xl font-bold leading-none" style={{ color }}>
        {value ?? '—'}
      </p>
      {sub && <p className="font-inter text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

// ── Donut actif ──────────────────────────────────────────────────────
function ActiveSlice(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props
  return (
    <g>
      <text x={cx} y={cy - 12} textAnchor="middle" fill="var(--wif-ink)"
        style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Space Grotesk' }}>
        {fmt(value)}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--wif-gray)" style={{ fontSize: 11 }}>
        {payload.name}
      </text>
      <text x={cx} y={cy + 28} textAnchor="middle" fill={fill}
        style={{ fontSize: 12, fontWeight: 600 }}>
        {(percent * 100).toFixed(1)} %
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8}
        startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 12} outerRadius={outerRadius + 16}
        startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  )
}

// ── Treemap cell ─────────────────────────────────────────────────────
function TreeCell(props) {
  const { x, y, width, height, name, value, index, depth } = props
  if (depth === 0 || width < 5 || height < 5) return null
  const color = C[index % C.length]
  const showText = width > 50 && height > 28
  const showVal = width > 70 && height > 48
  return (
    <g>
      <rect x={x + 1} y={y + 1} width={width - 2} height={height - 2}
        fill={color} rx={2}
        style={{ opacity: 0.9, transition: 'opacity 0.2s' }}
      />
      {showText && (
        <text x={x + width / 2} y={y + height / 2 - (showVal ? 7 : 0)}
          textAnchor="middle" fill="#fff"
          style={{ fontSize: Math.min(12, width / (name?.length || 1) * 1.6), fontWeight: 700, fontFamily: 'Space Grotesk' }}>
          {name && name.length > 14 ? name.slice(0, 14) + '…' : name}
        </text>
      )}
      {showVal && (
        <text x={x + width / 2} y={y + height / 2 + 10}
          textAnchor="middle" fill="rgba(255,255,255,0.75)" style={{ fontSize: 10 }}>
          {fmt(value)}
        </text>
      )}
    </g>
  )
}

// ── Section wrapper ──────────────────────────────────────────────────
function Section({ title, subtitle, children, className = '' }) {
  return (
    <div className={`bg-card border border-border/30 p-6 ${className}`}>
      {title && (
        <div className="mb-5">
          <h3 className="font-space-grotesk text-base font-bold text-foreground">{title}</h3>
          {subtitle && <p className="font-inter text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  )
}

// ── Écran de chargement ──────────────────────────────────────────────
function Loading() {
  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-24 flex flex-col items-center gap-6">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="font-inter text-xs uppercase tracking-widest text-muted-foreground">
        Chargement des données Supabase…
      </p>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ════════════════════════════════════════════════════════════════════
export default function Market() {
  const { data, loading, error } = useTendances()
  const [activeTab, setActiveTab] = useState('apercu')
  const [activePie1, setActivePie1] = useState(0)
  const [activePie2, setActivePie2] = useState(0)
  const [hoveredGenre, setHoveredGenre] = useState(null)

  const onPie1Enter = useCallback((_, index) => setActivePie1(index), [])
  const onPie2Enter = useCallback((_, index) => setActivePie2(index), [])

  if (loading) return <Loading />
  if (error) return (
    <div className="max-w-screen-2xl mx-auto px-6 py-24 text-center">
      <p className="font-space-grotesk text-xl font-bold text-destructive">Erreur : {error}</p>
    </div>
  )
  if (!data) return null

  const successPct = data.sampleSize > 0
    ? Math.round((data.successCount / (data.successCount + data.failCount)) * 100)
    : 0

  // ── Tab : Vue d'ensemble ─────────────────────────────────────────
  function AperçuTab() {
    return (
      <div className="space-y-6">
        {/* Graphe temporel — jeux par année (zoomable) */}
        <Section
          title="Jeux publiés par année (2010–2025)"
          subtitle="Utilisez la barre de sélection en bas pour zoomer sur une période"
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.gamesPerYear} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradYear" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E8005A" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#E8005A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--wif-border)" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--wif-gray)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--wif-gray)' }} />
              <Tooltip content={<Tip />} />
              <Brush dataKey="year" height={22} travellerWidth={8}
                fill="var(--wif-bg2)" stroke="var(--wif-pink)" />
              <Area type="monotone" dataKey="count" name="Jeux"
                stroke="#E8005A" strokeWidth={2.5}
                fill="url(#gradYear)" dot={{ r: 3, fill: '#E8005A' }}
                activeDot={{ r: 6, fill: '#E8005A' }} />
            </AreaChart>
          </ResponsiveContainer>
        </Section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Donut Free vs Paid */}
          <Section title="Répartition Gratuit / Payant" subtitle="Sur l'échantillon analysé">
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={220}>
                <PieChart>
                  <Pie
                    activeIndex={activePie1}
                    activeShape={ActiveSlice}
                    data={data.freePaid}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={90}
                    dataKey="value"
                    onMouseEnter={onPie1Enter}
                  >
                    {data.freePaid.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? '#007A8C' : '#E8005A'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-3">
                {data.freePaid.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: i === 0 ? '#007A8C' : '#E8005A' }} />
                    <div>
                      <p className="font-inter text-[10px] uppercase tracking-widest text-muted-foreground">{item.name}</p>
                      <p className="font-space-grotesk text-sm font-bold">{fmt(item.value)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* Top 8 genres — bar horizontal */}
          <Section title="Top 8 genres" subtitle="Par nombre de jeux dans la base">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={data.genreDistribution.slice(0, 8)}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--wif-border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--wif-gray)' }} />
                <YAxis dataKey="name" type="category" width={100}
                  tick={{ fontSize: 11, fill: 'var(--wif-ink)' }} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="value" name="Jeux" radius={[0, 3, 3, 0]}>
                  {data.genreDistribution.slice(0, 8).map((_, i) => (
                    <Cell key={i} fill={C[i % C.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </div>
      </div>
    )
  }

  // ── Tab : Genres & Catégories ────────────────────────────────────
  function GenresTab() {
    const treemapData = {
      name: 'genres',
      children: data.genreTreemap,
    }
    return (
      <div className="space-y-6">
        {/* Treemap genres */}
        <Section
          title="Carte des genres — Treemap"
          subtitle="La taille de chaque zone est proportionnelle au nombre de jeux du genre. Survolez pour le détail."
        >
          <ResponsiveContainer width="100%" height={380}>
            <Treemap
              data={treemapData.children}
              dataKey="size"
              nameKey="name"
              content={<TreeCell />}
            >
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0]?.payload
                  return (
                    <div style={{ background: 'var(--wif-bg)', border: '1px solid var(--wif-border)' }}
                      className="px-4 py-3 shadow-2xl rounded-sm">
                      <p className="font-space-grotesk text-sm font-bold">{d?.name}</p>
                      <p className="font-inter text-xs text-muted-foreground">{fmt(d?.size)} jeux</p>
                    </div>
                  )
                }}
              />
            </Treemap>
          </ResponsiveContainer>
        </Section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top 15 genres — bar */}
          <Section title="Genres — Top 15" subtitle="Nombre de jeux par genre">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={data.genreDistribution.slice(0, 15)}
                layout="vertical"
                margin={{ top: 0, right: 40, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--wif-border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--wif-gray)' }} />
                <YAxis dataKey="name" type="category" width={120}
                  tick={{ fontSize: 11, fill: 'var(--wif-ink)' }} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="value" name="Jeux" radius={[0, 3, 3, 0]}>
                  {data.genreDistribution.slice(0, 15).map((_, i) => (
                    <Cell key={i} fill={C[i % C.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>

          {/* Top 15 catégories — bar */}
          <Section title="Catégories — Top 15" subtitle="Nombre de jeux par catégorie Steam">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={data.categoryDistribution}
                layout="vertical"
                margin={{ top: 0, right: 40, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--wif-border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--wif-gray)' }} />
                <YAxis dataKey="name" type="category" width={130}
                  tick={{ fontSize: 11, fill: 'var(--wif-ink)' }} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="value" name="Jeux" radius={[0, 3, 3, 0]}>
                  {data.categoryDistribution.map((_, i) => (
                    <Cell key={i} fill={C[(i + 3) % C.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </div>

        {/* Radar chart genres */}
        <Section
          title="Radar — Taux de succès par genre"
          subtitle="Les genres avec au moins 5 jeux étiquetés dans l'échantillon"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <ResponsiveContainer width="100%" height={340}>
              <RadarChart data={data.genreSuccessRate.slice(0, 10)}>
                <PolarGrid stroke="var(--wif-border)" />
                <PolarAngleAxis dataKey="name"
                  tick={{ fontSize: 10, fill: 'var(--wif-ink)', fontFamily: 'Inter' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]}
                  tick={{ fontSize: 9, fill: 'var(--wif-gray)' }} />
                <Radar name="Taux de succès (%)" dataKey="successRate"
                  stroke="#E8005A" fill="#E8005A" fillOpacity={0.25} strokeWidth={2} />
                <Tooltip content={<Tip unit=" %" />} />
              </RadarChart>
            </ResponsiveContainer>
            <div>
              <p className="font-inter text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
                Classement détaillé
              </p>
              <div className="space-y-2">
                {data.genreSuccessRate.slice(0, 12).map((g, i) => (
                  <div key={g.name}
                    className="flex items-center gap-3 group cursor-default"
                    onMouseEnter={() => setHoveredGenre(g.name)}
                    onMouseLeave={() => setHoveredGenre(null)}
                  >
                    <span className="font-mono text-[10px] text-muted-foreground w-4">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-inter text-xs" style={{ color: hoveredGenre === g.name ? 'var(--wif-pink)' : 'var(--wif-ink)' }}>
                          {g.fullName || g.name}
                        </span>
                        <span className="font-space-grotesk text-xs font-bold" style={{ color: g.successRate >= 50 ? 'var(--wif-success)' : 'var(--wif-danger)' }}>
                          {g.successRate} %
                        </span>
                      </div>
                      <div className="h-1.5 bg-border/30 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${g.successRate}%`,
                            backgroundColor: g.successRate >= 50 ? 'var(--wif-success)' : 'var(--wif-danger)',
                          }} />
                      </div>
                    </div>
                    <span className="font-inter text-[10px] text-muted-foreground">{fmt(g.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>
      </div>
    )
  }

  // ── Tab : Succès & Performance ───────────────────────────────────
  function SuccesTab() {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Donut succès */}
          <Section title="Répartition Succès / Échec" subtitle="Jeux étiquetés is_successful dans la BDD">
            <div className="flex items-center justify-center gap-8">
              <ResponsiveContainer width="55%" height={220}>
                <PieChart>
                  <Pie
                    activeIndex={activePie2}
                    activeShape={ActiveSlice}
                    data={data.successDistribution}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={88}
                    dataKey="value"
                    onMouseEnter={onPie2Enter}
                  >
                    {data.successDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-4">
                {data.successDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <div>
                      <p className="font-inter text-[10px] uppercase tracking-widest text-muted-foreground">{item.name}</p>
                      <p className="font-space-grotesk text-lg font-bold" style={{ color: item.color }}>
                        {fmt(item.value)}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="mt-2 pt-2 border-t border-border/30">
                  <p className="font-inter text-[10px] uppercase tracking-widest text-muted-foreground">Taux de succès</p>
                  <p className="font-space-grotesk text-2xl font-bold" style={{ color: 'var(--wif-success)' }}>
                    {successPct} %
                  </p>
                </div>
              </div>
            </div>
          </Section>

          {/* Succès par score Metacritic */}
          <Section title="Succès selon le score Metacritic"
            subtitle="Corrélation entre note de presse et succès commercial">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.metacSuccessRate} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--wif-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--wif-gray)' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--wif-gray)' }} unit="%" />
                <Tooltip content={<Tip unit=" %" />} />
                <Bar dataKey="successRate" name="Taux succès" radius={[3, 3, 0, 0]}>
                  {data.metacSuccessRate.map((entry, i) => (
                    <Cell key={i} fill={entry.successRate >= 50 ? '#007A4C' : entry.successRate >= 35 ? '#E67E22' : '#CC1A1A'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Distribution des prix */}
          <Section title="Distribution des prix" subtitle="Répartition des jeux par tranche tarifaire">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.priceDistribution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--wif-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--wif-gray)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--wif-gray)' }} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="value" name="Jeux" radius={[3, 3, 0, 0]}>
                  {data.priceDistribution.map((_, i) => (
                    <Cell key={i} fill={C[i % C.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>

          {/* Succès par tranche de prix */}
          <Section title="Taux de succès par prix"
            subtitle="Quel segment de prix produit le plus de succès ?">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.priceSuccessRate} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--wif-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--wif-gray)' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--wif-gray)' }} unit="%" />
                <Tooltip content={<Tip unit=" %" />} />
                <Bar dataKey="successRate" name="Taux succès" radius={[3, 3, 0, 0]}>
                  {data.priceSuccessRate.map((entry, i) => (
                    <Cell key={i} fill={entry.successRate >= 50 ? '#007A4C' : entry.successRate >= 35 ? '#E67E22' : '#CC1A1A'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </div>

        {/* Distribution Metacritic */}
        <Section
          title="Distribution des scores Metacritic"
          subtitle="Répartition des jeux selon leur note critique (jeux avec score uniquement)"
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.metacriticDistribution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="gradMeta" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#CC1A1A" />
                  <stop offset="50%" stopColor="#E67E22" />
                  <stop offset="100%" stopColor="#007A4C" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--wif-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--wif-gray)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--wif-gray)' }} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="value" name="Jeux" fill="url(#gradMeta)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Section>
      </div>
    )
  }


  // ── Rendu principal ──────────────────────────────────────────────
  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-12">

      {/* Header */}
      <section className="mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="font-inter text-xs tracking-widest uppercase text-primary font-bold mb-2 block">
              Terminal / Tendances_Marché
            </span>
            <h1 className="font-space-grotesk text-5xl font-bold tracking-tight text-foreground">
              Tendances
            </h1>
            <p className="font-manrope text-muted-foreground mt-4 max-w-2xl leading-relaxed">
              Analyse complète de la base de données Steam — genres, catégories, taux de succès,
              distribution des prix et top jeux, en temps réel depuis Supabase.
            </p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <div className="bg-surface-container px-4 py-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary" style={{ fontSize: '18px' }}>database</span>
              <span className="font-inter text-[10px] font-bold uppercase tracking-tighter">
                {fmt(data.totalGames)} jeux indexés
              </span>
            </div>
            <p className="font-inter text-[10px] text-muted-foreground uppercase tracking-widest">
              Échantillon : {fmt(data.sampleSize)} jeux analysés
            </p>
          </div>
        </div>
      </section>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <KpiCard
          label="Jeux dans la BDD"
          value={fmt(data.totalGames)}
          icon="sports_esports"
          color="var(--wif-pink)"
        />
        <KpiCard
          label="Genres uniques"
          value={data.uniqueGenres}
          icon="category"
          color="var(--wif-cyan)"
          sub={`${data.uniqueCategories} catégories`}
        />
        <KpiCard
          label="Score Metacritic moyen"
          value={data.avgMetacritic > 0 ? data.avgMetacritic : '—'}
          icon="star"
          color="var(--wif-warn)"
          sub="Jeux avec score uniquement"
        />
        <KpiCard
          label="Taux de succès"
          value={`${successPct} %`}
          icon="trending_up"
          color="var(--wif-success)"
          sub={`${fmt(data.successCount)} réussis / ${fmt(data.failCount)} échecs`}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-border/30 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 font-inter text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-200 border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'apercu' && <AperçuTab />}
        {activeTab === 'genres' && <GenresTab />}
        {activeTab === 'succes' && <SuccesTab />}
        {activeTab === 'tags'   && <TagAnalytics />}
      </div>
    </div>
  )
}
