/**
 * Analyse Catalogue — /market
 * Dashboard analytique EDA alimenté par Supabase.
 */
import { useState } from 'react'
import TagAnalytics from '../components/database/TagAnalytics'
import {
  Area,
  BarChart, Bar,
  ComposedChart, Line,
  ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Brush, Cell, ReferenceLine, ReferenceArea,
} from 'recharts'
import { useTendances } from '../hooks/useTendances'
import { useTagAnalytics } from '../hooks/useTagAnalytics'

// ── Palette ──────────────────────────────────────────────────────────
const C = [
  '#E8005A', '#007A8C', '#00C8B4', '#4A90E2', '#007A4C',
  '#9B59B6', '#E67E22', '#1ABC9C', '#F39C12', '#CC1A1A',
  '#2ECC71', '#D35400', '#16A085', '#8E44AD', '#2980B9',
  '#E74C3C', '#3498DB', '#27AE60', '#F1C40F', '#E91E63',
]

const TABS = [
  { id: 'apercu',        label: 'Vue d\'ensemble',    icon: 'dashboard' },
  { id: 'distributions', label: 'Distributions',       icon: 'bar_chart' },
  { id: 'succes',        label: 'Facteurs de Succès',  icon: 'query_stats' },
  { id: 'tags',          label: 'Analyse par Tags',    icon: 'label' },
]

const fmt    = n => typeof n === 'number' ? n.toLocaleString('fr-FR') : n
const fmtEur = n => `${parseFloat(n).toFixed(2)} €`
function rateColor(r) {
  if (r >= 50) return '#007A4C'
  if (r >= 35) return '#E67E22'
  return '#CC1A1A'
}

// ── KPI Card ──────────────────────────────────────────────────────────
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

// ── Section wrapper ───────────────────────────────────────────────────
function Section({ title, subtitle, badge, children, className = '' }) {
  return (
    <div className={`bg-card border border-border/30 p-6 ${className}`}>
      {title && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-space-grotesk text-base font-bold text-foreground">{title}</h3>
            {subtitle && <p className="font-inter text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          {badge && (
            <span className="shrink-0 font-inter text-[10px] uppercase tracking-widest text-muted-foreground border border-border/40 px-2 py-1 whitespace-nowrap">
              {badge}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  )
}

// ── Stat Box — résumé statistique sous un graphe ─────────────────────
function StatBox({ items }) {
  return (
    <div className="flex flex-wrap gap-6 mt-5 pt-4 border-t border-border/30">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-0.5">
          <span className="font-inter text-[10px] uppercase tracking-widest text-muted-foreground">{item.label}</span>
          <span className="font-space-grotesk text-lg font-bold" style={{ color: item.color || 'var(--wif-cyan)' }}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Insight callout ───────────────────────────────────────────────────
function Insight({ icon, text, color = 'var(--wif-cyan)' }) {
  return (
    <div
      className="flex items-start gap-3 p-3 border border-border/20 mt-4"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <span className="material-symbols-outlined text-base shrink-0" style={{ color }}>{icon}</span>
      <p className="font-inter text-xs text-muted-foreground leading-relaxed">{text}</p>
    </div>
  )
}

// ── Tooltip custom générique ──────────────────────────────────────────
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
        <p key={i} className="font-space-grotesk text-sm font-bold" style={{ color: e.color || e.fill || 'var(--wif-ink)' }}>
          {e.name !== 'value' && e.name !== 'count' ? `${e.name} : ` : ''}
          {fmt(e.value)}{unit}
        </p>
      ))}
    </div>
  )
}

// ── Chargement ────────────────────────────────────────────────────────
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
// TAB : FACTEURS DE SUCCÈS — composant séparé pour pouvoir appeler un hook
// ════════════════════════════════════════════════════════════════════
const TAG_CATS = [
  { key: 'ambiance', label: 'Ambiance',  color: '#9B59B6' },
  { key: 'gameplay', label: 'Gameplay',  color: '#007A8C' },
  { key: 'visual',   label: 'Visuel',    color: '#E67E22' },
  { key: 'camera',   label: 'Caméra',    color: '#4A90E2' },
]

// Dot custom pour le scatter — cercle coloré sans label
function BubbleDot({ cx, cy, fill }) {
  if (!cx || !cy) return null
  return (
    <circle
      cx={cx} cy={cy} r={8}
      fill={fill} fillOpacity={0.88}
      stroke={fill} strokeWidth={3} strokeOpacity={0.22}
    />
  )
}

function SuccesTab({ data, successPct }) {
  const { data: tagData, loading: tagLoading } = useTagAnalytics()

  // Log-transformation pour étaler l'axe X
  const logCats = tagData ? TAG_CATS.map(cat => ({
    ...cat,
    logData: (tagData[cat.key] || []).map(t => ({
      ...t,
      logCount: parseFloat(Math.log10(Math.max(1, t.count)).toFixed(3)),
      cat: cat.label,
      color: cat.color,
    })),
  })) : []

  const allLogTags  = logCats.flatMap(c => c.logData)
  const avgLogCount = allLogTags.length > 0
    ? parseFloat((allLogTags.reduce((s, t) => s + t.logCount, 0) / allLogTags.length).toFixed(3))
    : 2
  const minLogCount = allLogTags.length > 0 ? Math.max(0, Math.min(...allLogTags.map(t => t.logCount)) - 0.05) : 0
  const maxLogCount = allLogTags.length > 0 ? Math.max(...allLogTags.map(t => t.logCount)) + 0.05 : 4

  // Domaine Y dynamique — colle aux vraies données pour optimiser l'espace
  const rawRates   = allLogTags.map(t => t.successRate)
  const minRate    = allLogTags.length > 0 ? Math.max(0,   Math.min(...rawRates) - 4) : 0
  const maxRate    = allLogTags.length > 0 ? Math.min(100, Math.max(...rawRates) + 8) : 100
  // Médiane des taux de succès des tags (séparateur horizontal plus pertinent que la moyenne globale)
  const sortedRates = [...rawRates].sort((a, b) => a - b)
  const medianRate  = sortedRates.length > 0 ? sortedRates[Math.floor(sortedRates.length / 2)] : successPct

  const topByRate  = [...allLogTags].sort((a, b) => b.successRate - a.successRate)[0]
  const topByCount = [...allLogTags].sort((a, b) => b.count - a.count)[0]
  const topPrice   = [...data.priceSuccessRate].sort((a, b) => b.successRate - a.successRate)[0]
  const topMeta    = [...data.metacSuccessRate].sort((a, b) => b.successRate - a.successRate)[0]

  return (
    <div className="space-y-6">

      {/* ── Insights ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Insight icon="emoji_events" color="var(--wif-pink)"
          text={topByRate
            ? `Tag le plus efficace : "${topByRate.fullName || topByRate.name}" (${topByRate.cat}) → ${topByRate.successRate}% de succès`
            : '—'}
        />
        <Insight icon="payments" color="var(--wif-cyan)"
          text={topPrice
            ? `Prix optimal : "${topPrice.name}" → ${topPrice.successRate}% de succès (N = ${fmt(topPrice.total)})`
            : '—'}
        />
        <Insight icon="star" color="var(--wif-warn)"
          text={topMeta
            ? `Metacritic "${topMeta.name}" → ${topMeta.successRate}% de succès`
            : '—'}
        />
      </div>

      {/* ── Scatter : matrice de positionnement des tags ── */}
      <Section
        title="Matrice de positionnement des tags"
        subtitle="X = popularité (échelle log) · Y = taux de succès · Survolez un point pour l'identifier"
        badge={`${allLogTags.length} tags`}
      >
        {tagLoading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={440}>
              <ScatterChart margin={{ top: 16, right: 24, left: 8, bottom: 36 }}>

                {/* ── Quadrants colorés ── */}
                <ReferenceArea
                  x1={minLogCount} x2={avgLogCount} y1={medianRate} y2={maxRate}
                  fill="#007A4C" fillOpacity={0.08}
                  label={{ value: 'Niche efficace ↑', position: 'insideTopLeft', fontSize: 10, fill: '#007A4C', fontWeight: 700 }}
                />
                <ReferenceArea
                  x1={avgLogCount} x2={maxLogCount} y1={medianRate} y2={maxRate}
                  fill="#E8005A" fillOpacity={0.08}
                  label={{ value: '★ Stars', position: 'insideTopRight', fontSize: 10, fill: '#E8005A', fontWeight: 700 }}
                />
                <ReferenceArea
                  x1={minLogCount} x2={avgLogCount} y1={minRate} y2={medianRate}
                  fill="#888" fillOpacity={0.04}
                  label={{ value: 'Zone morte ↓', position: 'insideBottomLeft', fontSize: 10, fill: '#888' }}
                />
                <ReferenceArea
                  x1={avgLogCount} x2={maxLogCount} y1={minRate} y2={medianRate}
                  fill="#E67E22" fillOpacity={0.07}
                  label={{ value: 'Piège populaire ↓', position: 'insideBottomRight', fontSize: 10, fill: '#E67E22' }}
                />

                <CartesianGrid strokeDasharray="3 3" stroke="var(--wif-border)" opacity={0.6} />

                <XAxis
                  type="number"
                  dataKey="logCount"
                  name="Popularité"
                  domain={[minLogCount, maxLogCount]}
                  tickFormatter={v => {
                    const n = Math.round(10 ** v)
                    return n >= 1000 ? `${(n / 1000).toFixed(0)}k` : `${n}`
                  }}
                  tick={{ fontSize: 10, fill: 'var(--wif-gray)' }}
                  label={{ value: 'Popularité — nombre de jeux portant ce tag (log)', position: 'insideBottom', offset: -20, fontSize: 10, fill: 'var(--wif-gray)' }}
                />
                <YAxis
                  type="number"
                  dataKey="successRate"
                  name="Taux de succès"
                  domain={[minRate, maxRate]}
                  unit="%"
                  tick={{ fontSize: 10, fill: 'var(--wif-gray)' }}
                  label={{ value: '% succès', angle: -90, position: 'insideLeft', offset: 14, fontSize: 10, fill: 'var(--wif-gray)' }}
                />

                {/* Lignes séparant les quadrants */}
                <ReferenceLine
                  x={avgLogCount}
                  stroke="var(--wif-border)" strokeWidth={1.5} strokeDasharray="6 3"
                />
                <ReferenceLine
                  y={medianRate}
                  stroke="var(--wif-warn)" strokeWidth={1.5} strokeDasharray="6 3"
                  label={{ value: `Md. ${medianRate}%`, position: 'insideTopRight', fontSize: 9, fill: 'var(--wif-warn)' }}
                />

                <Tooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0]?.payload
                    return (
                      <div
                        style={{ background: 'var(--wif-bg)', border: `2px solid ${d?.color}` }}
                        className="px-4 py-3 shadow-2xl rounded-sm min-w-44"
                      >
                        <p className="font-inter text-[9px] uppercase tracking-widest font-bold mb-1"
                          style={{ color: d?.color }}>
                          {d?.cat}
                        </p>
                        <p className="font-space-grotesk text-base font-bold text-foreground mb-2 leading-tight">
                          {d?.fullName || d?.name}
                        </p>
                        <div className="space-y-1 pt-2 border-t border-border/30">
                          <div className="flex justify-between gap-6">
                            <span className="font-inter text-xs text-muted-foreground">Popularité</span>
                            <span className="font-space-grotesk text-xs font-bold text-foreground">{fmt(d?.count)} jeux</span>
                          </div>
                          <div className="flex justify-between gap-6">
                            <span className="font-inter text-xs text-muted-foreground">Succès</span>
                            <span className="font-space-grotesk text-xs font-bold" style={{ color: rateColor(d?.successRate) }}>
                              {d?.successRate}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  }}
                />

                {logCats.map(cat => (
                  <Scatter
                    key={cat.key}
                    name={cat.label}
                    data={cat.logData}
                    fill={cat.color}
                    shape={<BubbleDot />}
                    isAnimationActive={true}
                    animationDuration={600}
                    animationEasing="ease-out"
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>

            {/* Légende catégories */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2">
              {TAG_CATS.map(cat => (
                <div key={cat.key} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="font-inter text-xs text-muted-foreground">{cat.label}</span>
                </div>
              ))}
              {topByCount && (
                <span className="ml-auto font-inter text-[10px] text-muted-foreground/60">
                  Tag le plus mainstream : <strong className="text-foreground">{topByCount.fullName || topByCount.name}</strong> ({fmt(topByCount.count)} jeux)
                </span>
              )}
            </div>
          </>
        )}
      </Section>

      {/* ── Prix × succès & Metacritic × succès ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <Section title="Taux de succès par tranche de prix" subtitle="Corrélation prix → succès commercial">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.priceSuccessRate} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--wif-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--wif-gray)' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--wif-gray)' }} unit="%" />
              <ReferenceLine y={successPct} stroke="var(--wif-warn)" strokeDasharray="5 3"
                label={{ value: `${successPct}%`, position: 'insideTopRight', fontSize: 10, fill: 'var(--wif-warn)' }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0]?.payload
                  return (
                    <div style={{ background: 'var(--wif-bg)', border: '1px solid var(--wif-border)' }}
                      className="px-4 py-3 shadow-2xl rounded-sm">
                      <p className="font-inter text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
                      <p className="font-space-grotesk text-sm font-bold" style={{ color: rateColor(d?.successRate) }}>
                        {d?.successRate}%
                      </p>
                      <p className="font-inter text-xs text-muted-foreground">N = {fmt(d?.total)}</p>
                    </div>
                  )
                }}
              />
              <Bar dataKey="successRate" name="Taux succès" radius={[4, 4, 0, 0]}>
                {data.priceSuccessRate.map((d, i) => (
                  <Cell key={i} fill={rateColor(d.successRate)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Section>

        <Section title="Taux de succès par score Metacritic" subtitle="Corrélation note critique → succès commercial">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.metacSuccessRate} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--wif-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--wif-gray)' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--wif-gray)' }} unit="%" />
              <ReferenceLine y={successPct} stroke="var(--wif-warn)" strokeDasharray="5 3"
                label={{ value: `${successPct}%`, position: 'insideTopRight', fontSize: 10, fill: 'var(--wif-warn)' }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0]?.payload
                  return (
                    <div style={{ background: 'var(--wif-bg)', border: '1px solid var(--wif-border)' }}
                      className="px-4 py-3 shadow-2xl rounded-sm">
                      <p className="font-inter text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
                      <p className="font-space-grotesk text-sm font-bold" style={{ color: rateColor(d?.successRate) }}>
                        {d?.successRate}%
                      </p>
                      <p className="font-inter text-xs text-muted-foreground">N = {fmt(d?.total)}</p>
                    </div>
                  )
                }}
              />
              <Bar dataKey="successRate" name="Taux succès" radius={[4, 4, 0, 0]}>
                {data.metacSuccessRate.map((d, i) => (
                  <Cell key={i} fill={rateColor(d.successRate)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Section>

      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ════════════════════════════════════════════════════════════════════
export default function Market() {
  const { data, loading, error } = useTendances()
  const [activeTab, setActiveTab] = useState('apercu')

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

  // ── TAB 1 : Vue d'ensemble ───────────────────────────────────────
  function AperçuTab() {
    // Pareto des genres — calcul côté client
    const total = data.genreDistribution.reduce((s, g) => s + g.value, 0)
    let cum = 0
    const paretoData = data.genreDistribution.slice(0, 20).map(g => {
      cum += g.value
      return {
        name: g.name.length > 14 ? g.name.slice(0, 14) + '…' : g.name,
        fullName: g.name,
        value: g.value,
        cumPct: parseFloat((cum / total * 100).toFixed(1)),
      }
    })
    const genres80 = paretoData.findIndex(d => d.cumPct >= 80) + 1

    return (
      <div className="space-y-6">

        {/* ── Timeline jeux/année ── */}
        <Section
          title="Volume de publications par année (2010–2025)"
          subtitle="Tendance long-terme de l'offre Steam et évolution du taux de succès"
          badge={`N = ${fmt(data.sampleSize)}`}
        >
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data.gamesPerYear} margin={{ top: 10, right: 55, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradYear" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#E8005A" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#E8005A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--wif-border)" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--wif-gray)' }} />
              <YAxis
                yAxisId="count"
                tick={{ fontSize: 10, fill: 'var(--wif-gray)' }}
                tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              />
              <YAxis
                yAxisId="rate"
                orientation="right"
                domain={[0, 100]}
                unit="%"
                tick={{ fontSize: 10, fill: '#007A4C' }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const count = payload.find(p => p.dataKey === 'count')
                  const rate  = payload.find(p => p.dataKey === 'successRate')
                  return (
                    <div style={{ background: 'var(--wif-bg)', border: '1px solid var(--wif-border)' }}
                      className="px-4 py-3 shadow-2xl rounded-sm">
                      <p className="font-inter text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
                      {count && (
                        <p className="font-space-grotesk text-sm font-bold" style={{ color: '#E8005A' }}>
                          {fmt(count.value)} jeux publiés
                        </p>
                      )}
                      {rate?.value != null && (
                        <p className="font-space-grotesk text-sm font-bold" style={{ color: '#007A4C' }}>
                          {rate.value}% de succès
                        </p>
                      )}
                    </div>
                  )
                }}
              />
              <Area
                yAxisId="count"
                type="monotone" dataKey="count" name="Jeux"
                stroke="#E8005A" strokeWidth={2.5}
                fill="url(#gradYear)"
                dot={{ r: 3, fill: '#E8005A' }}
                activeDot={{ r: 6, fill: '#E8005A' }}
              />
              <Line
                yAxisId="rate"
                type="monotone" dataKey="successRate" name="Taux de succès"
                stroke="#007A4C" strokeWidth={2.5}
                dot={{ r: 4, fill: '#007A4C', stroke: 'var(--card)', strokeWidth: 1.5 }}
                activeDot={{ r: 7, fill: '#007A4C' }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-6 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: '#E8005A' }} />
              <span className="font-inter text-[10px] text-muted-foreground uppercase tracking-widest">Jeux publiés (axe gauche)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: '#007A4C' }} />
              <span className="font-inter text-[10px] text-muted-foreground uppercase tracking-widest">Taux de succès % (axe droit)</span>
            </div>
          </div>
        </Section>

        {/* ── Saisonnalité — publications & succès par mois ── */}
        {(() => {
          // Couleurs par saison
          const seasonColors = [
            '#4A90E2', '#6BAED6', // Jan, Fév — Hiver
            '#74C476', '#41AB5D', '#238B45', // Mar, Avr, Mai — Printemps
            '#FEC44F', '#FE9929', '#EC7014', // Jun, Jul, Aoû — Été
            '#E74C3C', '#C0392B', '#9B59B6', // Sep, Oct, Nov — Automne
            '#2980B9', // Déc — Hiver
          ]
          const avgMonthCount = data.releaseByMonth.length > 0
            ? Math.round(data.releaseByMonth.reduce((s, m) => s + m.count, 0) / 12)
            : 0
          const topMonth = [...data.releaseByMonth].sort((a, b) => b.count - a.count)[0]

          return (
            <Section
              title="Saisonnalité des sorties — Jan à Déc"
              subtitle="Volume de publications et taux de succès agrégés sur toutes les années (2010–2025)"
              badge={`Moy. mensuelle : ${fmt(avgMonthCount)} jeux`}
            >
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={data.releaseByMonth} margin={{ top: 10, right: 55, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradSeason" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"  stopColor="#E8005A" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#E8005A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--wif-border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--wif-gray)' }} />
                  <YAxis
                    yAxisId="count"
                    tick={{ fontSize: 10, fill: 'var(--wif-gray)' }}
                    tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                  />
                  <YAxis
                    yAxisId="rate"
                    orientation="right"
                    domain={[0, 60]}
                    unit="%"
                    tick={{ fontSize: 10, fill: '#007A4C' }}
                  />
                  <ReferenceLine
                    yAxisId="count" y={avgMonthCount}
                    stroke="var(--wif-border)" strokeDasharray="5 3"
                    label={{ value: 'Moy.', position: 'insideTopRight', fontSize: 9, fill: 'var(--wif-gray)' }}
                  />
                  <Tooltip
                    cursor={{ fill: 'var(--wif-border)', fillOpacity: 0.2 }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      const count = payload.find(p => p.dataKey === 'count')
                      const rate  = payload.find(p => p.dataKey === 'successRate')
                      return (
                        <div style={{ background: 'var(--wif-bg)', border: '1px solid var(--wif-border)' }}
                          className="px-4 py-3 shadow-2xl rounded-sm">
                          <p className="font-inter text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
                          {count && (
                            <p className="font-space-grotesk text-sm font-bold text-foreground">
                              {fmt(count.value)} jeux publiés
                            </p>
                          )}
                          {rate?.value != null && (
                            <p className="font-space-grotesk text-sm font-bold" style={{ color: '#007A4C' }}>
                              {rate.value}% de succès
                            </p>
                          )}
                        </div>
                      )
                    }}
                  />
                  <Bar yAxisId="count" dataKey="count" name="Publications" radius={[4, 4, 0, 0]} maxBarSize={44}>
                    {data.releaseByMonth.map((_, i) => (
                      <Cell key={i} fill={seasonColors[i]} fillOpacity={0.85} />
                    ))}
                  </Bar>
                  <Line
                    yAxisId="rate"
                    type="monotone" dataKey="successRate" name="Taux de succès"
                    stroke="#007A4C" strokeWidth={2.5}
                    dot={{ r: 5, fill: '#007A4C', stroke: 'var(--card)', strokeWidth: 2 }}
                    activeDot={{ r: 8, fill: '#007A4C' }}
                    connectNulls={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>

              {/* Légende saisons */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-3">
                {[
                  { label: 'Hiver', color: '#4A90E2' },
                  { label: 'Printemps', color: '#41AB5D' },
                  { label: 'Été', color: '#FE9929' },
                  { label: 'Automne', color: '#E74C3C' },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="font-inter text-[10px] text-muted-foreground uppercase tracking-widest">{s.label}</span>
                  </div>
                ))}
                {topMonth && (
                  <span className="ml-auto font-inter text-[10px] text-muted-foreground/60">
                    Mois le plus chargé : <strong className="text-foreground">{topMonth.month}</strong> ({fmt(topMonth.count)} jeux)
                  </span>
                )}
                <div className="w-full flex items-center gap-2 mt-1">
                  <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: '#007A4C' }} />
                  <span className="font-inter text-[10px] text-muted-foreground uppercase tracking-widest">Taux de succès % (axe droit)</span>
                </div>
              </div>
            </Section>
          )
        })()}

        {/* ── Pareto genres ── */}
        <Section
          title="Analyse de Pareto — Répartition des genres"
          subtitle={`Principe 80/20 appliqué au catalogue : ${genres80} genres concentrent 80% des publications`}
          badge="Pareto 80/20"
        >
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={paretoData} margin={{ top: 10, right: 60, left: 10, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--wif-border)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: 'var(--wif-gray)', angle: -35, textAnchor: 'end' }}
                height={60}
              />
              <YAxis
                yAxisId="count"
                tick={{ fontSize: 10, fill: 'var(--wif-gray)' }}
              />
              <YAxis
                yAxisId="pct"
                orientation="right"
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: 'var(--wif-cyan)' }}
                unit="%"
              />
              <ReferenceLine
                yAxisId="pct" y={80}
                stroke="var(--wif-warn)" strokeDasharray="5 3"
                label={{ value: '80 %', position: 'insideTopRight', fontSize: 10, fill: 'var(--wif-warn)' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0]?.payload
                  return (
                    <div style={{ background: 'var(--wif-bg)', border: '1px solid var(--wif-border)' }}
                      className="px-4 py-3 shadow-2xl rounded-sm">
                      <p className="font-inter text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                        {d?.fullName}
                      </p>
                      <p className="font-space-grotesk text-sm font-bold text-foreground">{fmt(d?.value)} jeux</p>
                      <p className="font-space-grotesk text-sm" style={{ color: 'var(--wif-cyan)' }}>
                        Cumulé : {d?.cumPct}%
                      </p>
                    </div>
                  )
                }}
              />
              <Bar yAxisId="count" dataKey="value" name="Jeux" radius={[3, 3, 0, 0]}>
                {paretoData.map((d, i) => (
                  <Cell key={i} fill={d.cumPct <= 80 ? '#E8005A' : '#888'} fillOpacity={0.8} />
                ))}
              </Bar>
              <Line
                yAxisId="pct"
                type="monotone"
                dataKey="cumPct"
                name="% cumulé"
                stroke="var(--wif-cyan)"
                strokeWidth={2}
                dot={{ r: 3, fill: 'var(--wif-cyan)' }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
          <Insight
            icon="lightbulb"
            color="var(--wif-warn)"
            text={`Règle de Pareto : ${genres80} genres (barres roses) regroupent 80% du catalogue. Les barres grises forment la longue traîne — nombreux en genres, faibles en volume individuel.`}
          />
        </Section>

      </div>
    )
  }

  // ── TAB 2 : Distributions EDA ────────────────────────────────────
  function DistributionsTab() {
    return (
      <div className="space-y-6">

        {/* ── Distribution des prix ── */}
        <Section
          title="Distribution des prix (histogramme)"
          subtitle="Répartition des jeux par tranche tarifaire — variable quantitative discrétisée"
          badge={`μ = ${fmtEur(data.avgPricePaid)}  ·  Md = ${fmtEur(data.medianPricePaid)}`}
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.priceDistribution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--wif-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--wif-gray)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--wif-gray)' }} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="value" name="Jeux" radius={[4, 4, 0, 0]}>
                {data.priceDistribution.map((_, i) => (
                  <Cell key={i} fill={C[i % C.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <StatBox items={[
            { label: 'Moyenne (payants)',  value: fmtEur(data.avgPricePaid),    color: 'var(--wif-pink)' },
            { label: 'Médiane (payants)',  value: fmtEur(data.medianPricePaid), color: 'var(--wif-cyan)' },
            { label: 'Jeux gratuits',      value: fmt(data.freePaid[0]?.value), color: 'var(--wif-gray)' },
            { label: 'Jeux payants',       value: fmt(data.freePaid[1]?.value), color: 'var(--wif-gray)' },
          ]} />
          <Insight
            icon="info"
            color="var(--wif-cyan)"
            text="La différence entre moyenne et médiane indique une asymétrie droite (skewness positif) : quelques jeux premium tirent la moyenne vers le haut. La médiane est plus représentative du prix typique."
          />
        </Section>

        {/* ── Distribution Metacritic ── */}
        <Section
          title="Distribution des scores Metacritic (histogramme)"
          subtitle="Notes critiques agrégées — uniquement les jeux couverts par Metacritic"
          badge={`μ = ${data.avgMetacritic}  ·  Md = ${data.medianMetacritic}  ·  Couverture ${data.pctWithMetacritic}%`}
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.metacriticDistribution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="gradMeta" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stopColor="#CC1A1A" />
                  <stop offset="50%"  stopColor="#E67E22" />
                  <stop offset="100%" stopColor="#007A4C" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--wif-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--wif-gray)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--wif-gray)' }} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="value" name="Jeux" fill="url(#gradMeta)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <StatBox items={[
            { label: 'Score moyen',          value: data.avgMetacritic,        color: 'var(--wif-warn)' },
            { label: 'Score médian',          value: data.medianMetacritic,     color: 'var(--wif-cyan)' },
            { label: 'Couverture Metacritic', value: `${data.pctWithMetacritic}%`, color: 'var(--wif-gray)' },
          ]} />
          <Insight
            icon="warning"
            color="var(--wif-warn)"
            text={`Biais de sélection : seulement ${data.pctWithMetacritic}% du catalogue a un score Metacritic. Les jeux notés sont sur-représentés par les titres à forte visibilité. Toute corrélation avec le succès doit être interprétée avec précaution.`}
          />
        </Section>

        {/* ── Répartition Free/Paid + Succès global ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <Section title="Répartition Gratuit / Payant" subtitle="Structure tarifaire du catalogue Steam">
            <div className="space-y-5 mt-2">
              {data.freePaid.map((item, i) => {
                const pct = data.sampleSize > 0 ? Math.round(item.value / data.sampleSize * 100) : 0
                const colors = ['#007A8C', '#E8005A']
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-inter text-sm text-foreground">{item.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-space-grotesk text-base font-bold">{fmt(item.value)}</span>
                        <span className="font-inter text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-2.5 bg-border/30 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: colors[i] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Section>

          <Section title="Succès global du catalogue" subtitle="Label is_successful dans la base de données">
            <div className="space-y-5 mt-2">
              {data.successDistribution.map(item => {
                const pct = (data.successCount + data.failCount) > 0
                  ? Math.round(item.value / (data.successCount + data.failCount) * 100)
                  : 0
                return (
                  <div key={item.name}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-inter text-sm text-foreground">{item.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-space-grotesk text-base font-bold" style={{ color: item.color }}>
                          {fmt(item.value)}
                        </span>
                        <span className="font-inter text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-2.5 bg-border/30 rounded-full overflow-hidden">
                      <div className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: item.color }} />
                    </div>
                  </div>
                )
              })}
              <div className="pt-3 border-t border-border/30">
                <p className="font-inter text-[10px] uppercase tracking-widest text-muted-foreground">Taux de succès global</p>
                <p className="font-space-grotesk text-3xl font-bold" style={{ color: 'var(--wif-success)' }}>{successPct}%</p>
              </div>
            </div>
          </Section>

        </div>
      </div>
    )
  }

  // ── Rendu principal ──────────────────────────────────────────────
  return (
    <div className="technical-grid min-h-full">
      <div className="max-w-screen-2xl mx-auto px-6 py-12">

        {/* ── Hero Header ── */}
        <section className="mb-10 pl-5" style={{ borderLeft: '3px solid var(--primary)' }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--primary)' }} />
            <span className="font-label text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
              EDA / Catalogue_Steam
            </span>
          </div>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <h1 className="font-headline font-black tracking-tighter text-7xl text-foreground leading-none">
                ANALYSE DU{' '}
                <span style={{ color: 'var(--primary)' }}>CATALOGUE</span>
              </h1>
              <p className="mt-3 font-inter text-sm text-muted-foreground max-w-2xl">
                EDA complet du catalogue Steam — distributions, Pareto, corrélations et facteurs de succès,
                alimenté en temps réel depuis Supabase.
              </p>
            </div>
            <div className="shrink-0 flex flex-col gap-2 items-end">
              <div className="px-4 py-2 flex items-center gap-2"
                style={{ background: 'var(--card)', borderLeft: '4px solid var(--primary)' }}>
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

        {/* ── KPI Cards ── */}
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
            sub={`${data.uniqueCategories} catégories Steam`}
          />
          <KpiCard
            label="Score Metacritic moyen"
            value={data.avgMetacritic > 0 ? data.avgMetacritic : '—'}
            icon="star"
            color="var(--wif-warn)"
            sub={`Médiane : ${data.medianMetacritic} · Couverture : ${data.pctWithMetacritic}%`}
          />
          <KpiCard
            label="Taux de succès"
            value={`${successPct}%`}
            icon="trending_up"
            color="var(--wif-success)"
            sub={`${fmt(data.successCount)} réussis / ${fmt(data.failCount)} échecs`}
          />
        </div>

        {/* ── Tabs ── */}
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

        {/* ── Tab content ── */}
        <div>
          {activeTab === 'apercu'        && <AperçuTab />}
          {activeTab === 'distributions' && <DistributionsTab />}
          {activeTab === 'succes'        && <SuccesTab data={data} successPct={successPct} />}
          {activeTab === 'tags'          && <TagAnalytics />}
        </div>

      </div>
    </div>
  )
}
