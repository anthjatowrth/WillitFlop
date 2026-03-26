/**
 * Analyse Catalogue — /market
 * Dashboard analytique EDA alimenté par Supabase.
 */
import { useState } from 'react'
import { ChartCard } from '../components/database/TagAnalytics'
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
  { id: 'apercu',        label: 'Vue d\'ensemble',     icon: 'dashboard' },
  { id: 'distributions', label: 'Distributions',        icon: 'bar_chart' },
  { id: 'succes',        label: 'Analyse par Tags',     icon: 'label' },
  { id: 'tags',          label: 'Analyse de sentiment', icon: 'psychology' },
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


// ── Insight Box — analyse contextuelle ───────────────────────────────
function InsightBox({ icon = 'insights', title, children, standalone = false }) {
  const inner = (
    <div className="flex gap-4">
      <span
        className="material-symbols-outlined shrink-0 mt-0.5"
        style={{ fontSize: '18px', color: 'var(--wif-cyan)' }}
      >
        {icon}
      </span>
      <div className="flex-1">
        {title && (
          <p className="font-space-grotesk text-sm font-bold text-foreground mb-1.5">{title}</p>
        )}
        <p className="font-inter text-sm text-muted-foreground leading-relaxed">{children}</p>
      </div>
    </div>
  )
  if (standalone) {
    return <div className="bg-card border border-border/30 p-6">{inner}</div>
  }
  return <div className="mt-5 pt-5 border-t border-border/30">{inner}</div>
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

const CHARTS_CONFIG = [
  { key: 'genre',    step: 'Q1 / 6', title: 'Famille de ton jeu',     subtitle: 'Genres Steam — volume et taux de succès',          color: '#E8005A' },
  { key: 'ambiance', step: 'Q2 / 6', title: 'Ambiance de l\'univers', subtitle: "Tags d'univers — volume et taux de succès",        color: '#9B59B6' },
  { key: 'gameplay', step: 'Q3 / 6', title: 'Comment joue-t-on ?',   subtitle: 'Mécaniques & gameplay — volume et taux de succès', color: '#007A8C' },
  { key: 'visual',   step: 'Q4 / 6', title: 'Style graphique',        subtitle: 'Tags visuels — volume et taux de succès',          color: '#E67E22' },
  { key: 'camera',   step: 'Q5 / 6', title: 'Vue caméra principale',  subtitle: 'Tags perspective — volume et taux de succès',      color: '#4A90E2' },
  { key: 'playmode', step: 'Q6 / 6', title: 'Mode de jeu',            subtitle: 'Catégories Steam — volume et taux de succès',      color: '#007A4C' },
]

function SuccesTab({ successPct }) {
  const { data: tagData, loading: tagLoading } = useTagAnalytics()
  const [selectedChart, setSelectedChart] = useState(0)

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

  const topByCount = [...allLogTags].sort((a, b) => b.count - a.count)[0]

  return (
    <div className="space-y-6">

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
                  fill="#007A4C" fillOpacity={0.13}
                  label={{ value: 'Niche Efficace', position: 'insideTopLeft', fontSize: 32, fill: '#007A4C', fillOpacity: 0.80, fontWeight: 900, opacity: 0.90 }}
                />
                <ReferenceArea
                  x1={avgLogCount} x2={maxLogCount} y1={medianRate} y2={maxRate}
                  fill="#E8005A" fillOpacity={0.13}
                  label={{ value: '★ Stars', position: 'insideTopRight', fontSize: 32, fill: '#E8005A', fontWeight: 900, opacity: 0.90 }}
                />
                <ReferenceArea
                  x1={minLogCount} x2={avgLogCount} y1={minRate} y2={medianRate}
                  fill="#888" fillOpacity={0.08}
                  label={{ value: 'Zone Morte', position: 'insideBottomLeft', fontSize: 32, fill: '#888', fontWeight: 900, opacity: 0.90 }}
                />
                <ReferenceArea
                  x1={avgLogCount} x2={maxLogCount} y1={minRate} y2={medianRate}
                  fill="#E67E22" fillOpacity={0.12}
                  label={{ value: 'Piège Populaire', position: 'insideBottomRight', fontSize: 32, fill: '#E67E22', fontWeight: 900, opacity: 0.90 }}
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
                  tick={{ fontSize: 12, fill: 'var(--wif-gray)' }}
                  label={{ value: 'Popularité — nombre de jeux portant ce tag (log)', position: 'insideBottom', offset: -20, fontSize: 12, fill: 'var(--wif-gray)' }}
                />
                <YAxis
                  type="number"
                  dataKey="successRate"
                  name="Taux de succès"
                  domain={[minRate, maxRate]}
                  unit="%"
                  tick={{ fontSize: 12, fill: 'var(--wif-gray)' }}
                  label={{ value: '% succès', angle: -90, position: 'insideLeft', offset: 14, fontSize: 12, fill: 'var(--wif-gray)' }}
                />

                {/* Lignes séparant les quadrants */}
                <ReferenceLine
                  x={avgLogCount}
                  stroke="var(--wif-border)" strokeWidth={1.5} strokeDasharray="6 3"
                />
                <ReferenceLine
                  y={medianRate}
                  stroke="var(--wif-warn)" strokeWidth={1.5} strokeDasharray="6 3"
                  label={{ value: `Md. ${medianRate}%`, position: 'insideTopRight', fontSize: 12, fill: 'var(--wif-warn)' }}
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
                  <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="font-inter text-sm text-muted-foreground">{cat.label}</span>
                </div>
              ))}
              {topByCount && (
                <span className="ml-auto font-inter text-xs text-muted-foreground/60">
                  Tag le plus mainstream : <strong className="text-foreground">{topByCount.fullName || topByCount.name}</strong> ({fmt(topByCount.count)} jeux)
                </span>
              )}
            </div>
          </>
        )}
        <InsightBox icon="scatter_plot" title="Comprendre la matrice : quatre zones, quatre stratégies">
          Ce graphique est l'un des plus stratégiques de l'application. Chaque point représente un tag — une caractéristique de votre jeu — positionné selon deux axes : sa popularité (combien de jeux le portent) et son taux de succès historique. Les <strong>Stars</strong> en haut à droite sont populaires et performantes, mais ultra-compétitives. Les <strong>Niches Efficaces</strong> en haut à gauche sont les pépites : peu de jeux les portent, mais ceux qui le font réussissent souvent — idéal pour se différencier. Le <strong>Piège Populaire</strong> en bas à droite est la zone à éviter : des caractéristiques très usitées dont le taux de succès reste médiocre, souvent parce que le marché est saturé. La <strong>Zone Morte</strong> concentre les tags rares ET peu performants. La meilleure stratégie de positionnement combine généralement une "Star" pour la crédibilité et une "Niche Efficace" pour se démarquer.
        </InsightBox>
      </Section>

      {/* ── Graphiques par catégorie de tag — sélecteur interactif ── */}
      <Section
        title="Analyse par catégorie de tags"
        subtitle="Sélectionnez une dimension pour explorer le volume et le taux de succès"
      >
        {/* Boutons sélecteur */}
        <div className="flex flex-wrap gap-2 mb-5">
          {CHARTS_CONFIG.map((c, i) => (
            <button
              key={c.key}
              onClick={() => setSelectedChart(i)}
              className="px-3 py-1.5 font-inter text-xs font-bold uppercase tracking-widest border transition-all duration-150"
              style={
                selectedChart === i
                  ? { backgroundColor: c.color, borderColor: c.color, color: '#fff' }
                  : { borderColor: 'var(--wif-border)', color: 'var(--wif-gray)' }
              }
            >
              {c.title}
            </button>
          ))}
        </div>

        {/* Chart sélectionné */}
        {tagLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tagData ? (
          <ChartCard
            step={CHARTS_CONFIG[selectedChart].step}
            title={CHARTS_CONFIG[selectedChart].title}
            subtitle={CHARTS_CONFIG[selectedChart].subtitle}
            data={tagData[CHARTS_CONFIG[selectedChart].key]}
            color={CHARTS_CONFIG[selectedChart].color}
          />
        ) : null}
        <InsightBox icon="label" title="Lire le succès à travers les mécaniques">
          Chaque dimension — ambiance, gameplay, visuel, caméra, mode de jeu — raconte une histoire différente sur ce que les joueurs plébiscitent réellement. Certaines mécaniques affichent des taux de succès bien au-dessus de la moyenne, non pas parce qu'elles sont objectivement "meilleures", mais parce qu'elles répondent à des attentes précises et documentées d'une communauté fidèle. À l'inverse, des approches très courantes peuvent souffrir d'un excès d'offre : le marché est saturé, les joueurs deviennent sélectifs. L'enjeu pour tout créateur n'est pas de cocher les tags populaires pour plaire à l'algorithme, mais de comprendre quels assemblages de caractéristiques créent une valeur perçue unique. C'est l'origine de tout positionnement différenciant — et la base de tout pitch convaincant auprès des joueurs comme des éditeurs.
        </InsightBox>
      </Section>

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
          <InsightBox icon="show_chart" title="Une offre qui a explosé, une visibilité qui s'est effondrée">
            Entre 2010 et aujourd'hui, le nombre de jeux publiés sur Steam a été multiplié par plus de 30. Cette croissance n'est pas le signe d'un marché en bonne santé — c'est le résultat d'une démocratisation des outils de développement et d'une politique de publication de plus en plus permissive. La conséquence directe : le taux de succès moyen s'est érodé à mesure que la concurrence s'est intensifiée. Pour un jeu indépendant lancé aujourd'hui, la probabilité statistique d'être découvert sans stratégie marketing active est infime. La qualité ne suffit plus ; la visibilité est devenue la ressource la plus rare de l'écosystème Steam.
          </InsightBox>
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
              <InsightBox icon="calendar_month" title="Le calendrier de sortie, un levier souvent sous-estimé">
                Les données révèlent un paradoxe saisonnier bien documenté : les mois à fort volume de publications (généralement avant les grandes fêtes) correspondent à une compétition maximale pour l'attention des joueurs. Sortir "avec la masse" dilue mécaniquement la visibilité dans les storefronts et les algorithmes de recommandation. À l'inverse, les périodes plus creuses offrent moins de concurrence directe et peuvent générer un taux de découverte plus élevé à budget égal. La stratégie optimale n'est pas toujours de cibler les fenêtres de forte activité — c'est d'identifier les semaines où votre jeu aura le moins de rivaux directs pour capter l'attention.
              </InsightBox>
            </Section>
          )
        })()}

        {/* ── Twitch Live Snapshot ── */}
        <Section
          title="Présence Twitch du catalogue"
          subtitle="Viewers & streams actifs au dernier snapshot — données live actualisées en continu"
          badge={data.twitchFetchedAt ? `Snapshot ${data.twitchFetchedAt}` : 'Live'}
        >
          {/* KPIs inline */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              {
                label: 'Jeux sur Twitch',
                value: `${data.twitchCoverage}%`,
                sub: `${fmt(data.twitchCount)} jeux représentés`,
                color: '#9B59B6',
              },
              {
                label: 'Viewers live',
                value: fmt(data.twitchTotalViewers),
                sub: 'spectateurs au snapshot',
                color: '#E8005A',
              },
              {
                label: 'Succès Twitch vs sans',
                value: `+${data.twitchSuccessRate - data.nonTwitchSuccessRate}pts`,
                sub: `${data.twitchSuccessRate}% vs ${data.nonTwitchSuccessRate}%`,
                color: '#007A4C',
              },
            ].map((k, i) => (
              <div key={i} className="bg-background/50 border border-border/20 p-4"
                style={{ borderLeft: `3px solid ${k.color}` }}>
                <p className="font-inter text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{k.label}</p>
                <p className="font-space-grotesk text-2xl font-bold leading-none" style={{ color: k.color }}>{k.value}</p>
                <p className="font-inter text-xs text-muted-foreground mt-1">{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Bar chart horizontal — top genres par viewers */}
          {data.twitchByGenre.length > 0 ? (
            <>
              <p className="font-inter text-xs text-muted-foreground mb-3 uppercase tracking-widest">
                Top genres — viewers Twitch cumulés
              </p>
              <ResponsiveContainer width="100%" height={data.twitchByGenre.length * 38 + 20}>
                <BarChart
                  data={data.twitchByGenre}
                  layout="vertical"
                  margin={{ top: 0, right: 60, left: 8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gradTwitch" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%"   stopColor="#9B59B6" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#E8005A" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--wif-border)" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12, fill: 'var(--wif-gray)' }}
                    tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fontSize: 12, fill: 'var(--wif-gray)' }}
                  />
                  <Tooltip
                    cursor={{ fill: 'var(--wif-border)', fillOpacity: 0.15 }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0]?.payload
                      return (
                        <div style={{ background: 'var(--wif-bg)', border: '2px solid #9B59B6' }}
                          className="px-4 py-3 shadow-2xl rounded-sm min-w-40">
                          <p className="font-inter text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: '#9B59B6' }}>
                            {d?.name}
                          </p>
                          <p className="font-space-grotesk text-base font-bold text-foreground">
                            {fmt(d?.viewers)} viewers
                          </p>
                          <p className="font-inter text-xs text-muted-foreground">{fmt(d?.games)} jeux</p>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="viewers" name="Viewers" fill="url(#gradTwitch)" radius={[0, 4, 4, 0]}>
                    {data.twitchByGenre.map((_, i) => (
                      <Cell key={i} fill="url(#gradTwitch)" fillOpacity={1 - i * 0.06} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          ) : (
            <p className="font-inter text-sm text-muted-foreground text-center py-8">Aucune donnée Twitch disponible</p>
          )}
          <InsightBox icon="live_tv" title="Le streaming, signal de marché autant que canal de visibilité">
            L'écart de taux de succès entre les jeux présents sur Twitch et les autres n'est pas anodin. Il ne signifie pas que le streaming "crée" le succès — il révèle que les jeux capables de générer du contenu streamable partagent des caractéristiques intrinsèques : forte rejouabilité, moments spectaculaires, dynamique sociale. Twitch est à la fois un canal de distribution et un indicateur de conception. Un jeu difficile à streamer est souvent un jeu difficile à faire découvrir par le bouche-à-oreille numérique, qui reste aujourd'hui le principal vecteur de croissance organique sur Steam. Concevoir des moments "clipables" dès le début du développement n'est pas du cynisme — c'est de la stratégie.
          </InsightBox>
        </Section>

      </div>
    )
  }

  // ── TAB 2 : Distributions EDA ────────────────────────────────────
  function DistributionsTab() {
    // Pareto des genres — trimé à la zone 80% + 2 barres après
    const paretoTotal = data.genreDistribution.reduce((s, g) => s + g.value, 0)
    let parCum = 0
    const allParetoData = data.genreDistribution.slice(0, 20).map(g => {
      parCum += g.value
      return {
        name: g.name.length > 14 ? g.name.slice(0, 14) + '…' : g.name,
        fullName: g.name,
        value: g.value,
        cumPct: parseFloat((parCum / paretoTotal * 100).toFixed(1)),
      }
    })
    const cutoffIdx  = allParetoData.findIndex(d => d.cumPct >= 80)
    const paretoData = allParetoData.slice(0, cutoffIdx >= 0 ? cutoffIdx + 3 : allParetoData.length)
    const genres80   = cutoffIdx + 1

    // Merge distribution + taux de succès par bucket (buckets alignés dans le hook)
    const priceSuccessMap = Object.fromEntries((data.priceSuccessRate || []).map(d => [d.name, d.successRate]))
    const priceData = data.priceDistribution.map(d => ({ ...d, successRate: priceSuccessMap[d.name] ?? null }))

    const metacSuccessMap = Object.fromEntries((data.metacSuccessRate || []).map(d => [d.name, d.successRate]))
    const metacData = data.metacriticDistribution.map(d => ({ ...d, successRate: metacSuccessMap[d.name] ?? null }))

    return (
      <div className="space-y-6">

        {/* ── Distribution des prix + Metacritic côte à côte ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <Section
            title="Distribution des prix"
            subtitle="Répartition par tranche tarifaire · taux de succès par tranche"
            badge={`μ = ${fmtEur(data.avgPricePaid)}  ·  Md = ${fmtEur(data.medianPricePaid)}`}
          >
            <ResponsiveContainer width="100%" height={230}>
              <ComposedChart data={priceData} margin={{ top: 10, right: 40, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--wif-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--wif-gray)' }} />
                <YAxis
                  yAxisId="count"
                  tick={{ fontSize: 11, fill: 'var(--wif-gray)' }}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                />
                <YAxis
                  yAxisId="rate"
                  orientation="right"
                  domain={[0, 100]}
                  unit="%"
                  tick={{ fontSize: 11, fill: '#007A4C' }}
                />
                <ReferenceLine
                  yAxisId="rate" y={successPct}
                  stroke="var(--wif-warn)" strokeDasharray="5 3"
                  label={{ value: `${successPct}%`, position: 'insideTopRight', fontSize: 11, fill: 'var(--wif-warn)' }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const count = payload.find(p => p.dataKey === 'value')
                    const rate  = payload.find(p => p.dataKey === 'successRate')
                    return (
                      <div style={{ background: 'var(--wif-bg)', border: '1px solid var(--wif-border)' }}
                        className="px-4 py-3 shadow-2xl rounded-sm">
                        <p className="font-inter text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
                        {count && <p className="font-space-grotesk text-sm font-bold text-foreground">{fmt(count.value)} jeux</p>}
                        {rate?.value != null && (
                          <p className="font-space-grotesk text-sm font-bold" style={{ color: rateColor(rate.value) }}>
                            {rate.value}% succès
                          </p>
                        )}
                      </div>
                    )
                  }}
                />
                <Bar yAxisId="count" dataKey="value" name="Jeux" radius={[4, 4, 0, 0]} maxBarSize={44}>
                  {priceData.map((_, i) => (
                    <Cell key={i} fill={C[i % C.length]} fillOpacity={0.85} />
                  ))}
                </Bar>
                <Line
                  yAxisId="rate"
                  type="monotone" dataKey="successRate"
                  stroke="#007A4C" strokeWidth={2.5}
                  dot={{ r: 4, fill: '#007A4C', stroke: 'var(--card)', strokeWidth: 2 }}
                  activeDot={{ r: 7 }}
                  connectNulls={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-6 mt-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: '#007A4C' }} />
                <span className="font-inter text-[10px] text-muted-foreground uppercase tracking-widest">% succès (axe droit)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 rounded-sm shrink-0" style={{ backgroundColor: C[0], opacity: 0.85 }} />
                <span className="font-inter text-[10px] text-muted-foreground uppercase tracking-widest">Nb jeux (axe gauche)</span>
              </div>
            </div>
            <StatBox items={[
              { label: 'Moyenne',  value: fmtEur(data.avgPricePaid),    color: 'var(--wif-pink)' },
              { label: 'Médiane', value: fmtEur(data.medianPricePaid), color: 'var(--wif-cyan)' },
              { label: 'Gratuits', value: fmt(data.freePaid[0]?.value), color: 'var(--wif-gray)' },
              { label: 'Payants',  value: fmt(data.freePaid[1]?.value), color: 'var(--wif-gray)' },
            ]} />
          </Section>

          <Section
            title="Distribution Metacritic"
            subtitle="Notes critiques — jeux couverts par Metacritic · taux de succès par tranche"
            badge={`μ = ${data.avgMetacritic}  ·  Md = ${data.medianMetacritic}  ·  ${data.pctWithMetacritic}%`}
          >
            <ResponsiveContainer width="100%" height={230}>
              <ComposedChart data={metacData} margin={{ top: 10, right: 40, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--wif-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--wif-gray)' }} />
                <YAxis
                  yAxisId="count"
                  tick={{ fontSize: 11, fill: 'var(--wif-gray)' }}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                />
                <YAxis
                  yAxisId="rate"
                  orientation="right"
                  domain={[0, 100]}
                  unit="%"
                  tick={{ fontSize: 11, fill: '#4A90E2' }}
                />
                <ReferenceLine
                  yAxisId="rate" y={successPct}
                  stroke="var(--wif-warn)" strokeDasharray="5 3"
                  label={{ value: `${successPct}%`, position: 'insideTopRight', fontSize: 11, fill: 'var(--wif-warn)' }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const count = payload.find(p => p.dataKey === 'value')
                    const rate  = payload.find(p => p.dataKey === 'successRate')
                    return (
                      <div style={{ background: 'var(--wif-bg)', border: '1px solid var(--wif-border)' }}
                        className="px-4 py-3 shadow-2xl rounded-sm">
                        <p className="font-inter text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
                        {count && <p className="font-space-grotesk text-sm font-bold text-foreground">{fmt(count.value)} jeux</p>}
                        {rate?.value != null && (
                          <p className="font-space-grotesk text-sm font-bold" style={{ color: rateColor(rate.value) }}>
                            {rate.value}% succès
                          </p>
                        )}
                      </div>
                    )
                  }}
                />
                <Bar yAxisId="count" dataKey="value" name="Jeux" radius={[4, 4, 0, 0]} maxBarSize={44}>
                  {metacData.map((_, i) => (
                    <Cell key={i} fill={C[i % C.length]} fillOpacity={0.85} />
                  ))}
                </Bar>
                <Line
                  yAxisId="rate"
                  type="monotone" dataKey="successRate"
                  stroke="#4A90E2" strokeWidth={2.5}
                  dot={{ r: 4, fill: '#4A90E2', stroke: 'var(--card)', strokeWidth: 2 }}
                  activeDot={{ r: 7 }}
                  connectNulls={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-6 mt-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: '#4A90E2' }} />
                <span className="font-inter text-[10px] text-muted-foreground uppercase tracking-widest">% succès (axe droit)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 rounded-sm shrink-0" style={{ backgroundColor: C[0], opacity: 0.85 }} />
                <span className="font-inter text-[10px] text-muted-foreground uppercase tracking-widest">Nb jeux (axe gauche)</span>
              </div>
            </div>
            <StatBox items={[
              { label: 'Score moyen',  value: data.avgMetacritic,           color: 'var(--wif-warn)' },
              { label: 'Score médian', value: data.medianMetacritic,        color: 'var(--wif-cyan)' },
              { label: 'Couverture',   value: `${data.pctWithMetacritic}%`, color: 'var(--wif-gray)' },
            ]} />
          </Section>

        </div>

        <InsightBox standalone icon="psychology_alt" title="Prix et qualité : deux variables qui comptent, mais pas comme on le croit">
          La distribution des prix révèle un marché profondément segmenté : une majorité de jeux gratuits ou très abordables, et un segment premium qui affiche de meilleures performances. Ce n'est pas la gratuité qui pénalise en soi — c'est qu'un prix bas s'accompagne souvent d'un positionnement flou et d'un lancement peu préparé. Côté Metacritic, la corrélation entre note critique et succès commercial est réelle mais limitée : la couverture presse reste marginale (moins de 10 % du catalogue est noté). La majorité des jeux ne sera jamais testée par un journaliste — ce sont les avis utilisateurs Steam qui font office de référence pour 90 % du marché. Travailler sa réputation auprès des joueurs est donc bien plus impactant que de viser une couverture critique.
        </InsightBox>

        {/* ── Playtime × succès + Achievements × succès ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <Section
            title="Durée de jeu (playtime)"
            subtitle="Distribution des jeux par durée médiane · lien avec le taux de succès"
            badge={`N = ${fmt(data.playtimeDistribution.reduce((s, d) => s + d.count, 0))}`}
          >
            <ResponsiveContainer width="100%" height={230}>
              <ComposedChart data={data.playtimeDistribution} margin={{ top: 10, right: 40, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--wif-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--wif-gray)' }} />
                <YAxis
                  yAxisId="count"
                  tick={{ fontSize: 11, fill: 'var(--wif-gray)' }}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                />
                <YAxis
                  yAxisId="rate"
                  orientation="right"
                  domain={[0, 100]}
                  unit="%"
                  tick={{ fontSize: 11, fill: '#007A8C' }}
                />
                <ReferenceLine
                  yAxisId="rate" y={successPct}
                  stroke="var(--wif-warn)" strokeDasharray="5 3"
                  label={{ value: `${successPct}%`, position: 'insideTopRight', fontSize: 11, fill: 'var(--wif-warn)' }}
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
                        {count && <p className="font-space-grotesk text-sm font-bold text-foreground">{fmt(count.value)} jeux</p>}
                        {rate?.value != null && (
                          <p className="font-space-grotesk text-sm font-bold" style={{ color: rateColor(rate.value) }}>
                            {rate.value}% succès
                          </p>
                        )}
                      </div>
                    )
                  }}
                />
                <Bar yAxisId="count" dataKey="count" name="Jeux" radius={[4, 4, 0, 0]} maxBarSize={44}>
                  {data.playtimeDistribution.map((_, i) => (
                    <Cell key={i} fill={C[i % C.length]} fillOpacity={0.85} />
                  ))}
                </Bar>
                <Line
                  yAxisId="rate"
                  type="monotone" dataKey="successRate"
                  stroke="#007A8C" strokeWidth={2.5}
                  dot={{ r: 4, fill: '#007A8C', stroke: 'var(--card)', strokeWidth: 2 }}
                  activeDot={{ r: 7 }}
                  connectNulls={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-6 mt-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: '#007A8C' }} />
                <span className="font-inter text-[10px] text-muted-foreground uppercase tracking-widest">% succès (axe droit)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 rounded-sm shrink-0" style={{ backgroundColor: C[0], opacity: 0.85 }} />
                <span className="font-inter text-[10px] text-muted-foreground uppercase tracking-widest">Nb jeux (axe gauche)</span>
              </div>
            </div>
          </Section>

          <Section
            title="Taux de débloquage des succès"
            subtitle="Médiane d'unlock rate par tranche · lien avec le taux de succès"
            badge={`N = ${fmt(data.achievementDistribution.reduce((s, d) => s + d.count, 0))}`}
          >
            <ResponsiveContainer width="100%" height={230}>
              <ComposedChart data={data.achievementDistribution} margin={{ top: 10, right: 40, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--wif-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--wif-gray)' }} />
                <YAxis
                  yAxisId="count"
                  tick={{ fontSize: 11, fill: 'var(--wif-gray)' }}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                />
                <YAxis
                  yAxisId="rate"
                  orientation="right"
                  domain={[0, 100]}
                  unit="%"
                  tick={{ fontSize: 11, fill: '#9B59B6' }}
                />
                <ReferenceLine
                  yAxisId="rate" y={successPct}
                  stroke="var(--wif-warn)" strokeDasharray="5 3"
                  label={{ value: `${successPct}%`, position: 'insideTopRight', fontSize: 11, fill: 'var(--wif-warn)' }}
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
                        {count && <p className="font-space-grotesk text-sm font-bold text-foreground">{fmt(count.value)} jeux</p>}
                        {rate?.value != null && (
                          <p className="font-space-grotesk text-sm font-bold" style={{ color: rateColor(rate.value) }}>
                            {rate.value}% succès
                          </p>
                        )}
                      </div>
                    )
                  }}
                />
                <Bar yAxisId="count" dataKey="count" name="Jeux" radius={[4, 4, 0, 0]} maxBarSize={44}>
                  {data.achievementDistribution.map((_, i) => (
                    <Cell key={i} fill={C[(i + 4) % C.length]} fillOpacity={0.85} />
                  ))}
                </Bar>
                <Line
                  yAxisId="rate"
                  type="monotone" dataKey="successRate"
                  stroke="#9B59B6" strokeWidth={2.5}
                  dot={{ r: 4, fill: '#9B59B6', stroke: 'var(--card)', strokeWidth: 2 }}
                  activeDot={{ r: 7 }}
                  connectNulls={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-6 mt-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: '#9B59B6' }} />
                <span className="font-inter text-[10px] text-muted-foreground uppercase tracking-widest">% succès (axe droit)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 rounded-sm shrink-0" style={{ backgroundColor: C[4], opacity: 0.85 }} />
                <span className="font-inter text-[10px] text-muted-foreground uppercase tracking-widest">Nb jeux (axe gauche)</span>
              </div>
            </div>
          </Section>

        </div>

        <InsightBox standalone icon="hourglass_bottom" title="Durée et progression : l'engagement comme moteur de réputation">
          Les jeux avec une durée de jeu intermédiaire affichent généralement les meilleurs taux de succès. Cette "golden zone" correspond à une expérience suffisamment longue pour générer des avis positifs et des recommandations organiques, sans imposer un engagement excessif qui freine l'achat impulsif. Les systèmes de succès (achievements) jouent un rôle similaire : ils structurent l'expérience, créent des objectifs secondaires et prolongent la durée de vie perçue du jeu. Un système de succès bien pensé n'est pas un gadget — c'est un outil de rétention qui signale à l'algorithme Steam une base de joueurs active et engagée, ce qui améliore directement la fréquence d'apparition dans les recommandations.
        </InsightBox>

        {/* ── Pareto genres ── */}
        <Section
          title="Analyse de Pareto — Répartition des genres"
          subtitle={`Principe 80/20 : ${genres80} genres concentrent 80% des publications Steam`}
          badge="Pareto 80/20"
        >
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={paretoData} margin={{ top: 10, right: 60, left: 10, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--wif-border)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'var(--wif-gray)', angle: -35, textAnchor: 'end' }}
                height={60}
              />
              <YAxis
                yAxisId="count"
                tick={{ fontSize: 12, fill: 'var(--wif-gray)' }}
                tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              />
              <YAxis
                yAxisId="pct"
                orientation="right"
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: 'var(--wif-cyan)' }}
                unit="%"
              />
              <ReferenceLine
                yAxisId="pct" y={80}
                stroke="var(--wif-warn)" strokeDasharray="5 3"
                label={{ value: '80 %', position: 'insideTopRight', fontSize: 12, fill: 'var(--wif-warn)' }}
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
          <div className="flex items-center gap-6 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: '#E8005A' }} />
              <span className="font-inter text-sm text-muted-foreground">Genres dans le top 80%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: '#888' }} />
              <span className="font-inter text-sm text-muted-foreground">Longue traîne</span>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: 'var(--wif-cyan)' }} />
              <span className="font-inter text-sm text-muted-foreground">% cumulé (axe droit)</span>
            </div>
          </div>
          <InsightBox icon="bar_chart_4_bars" title="La loi de Pareto est impitoyable sur Steam">
            Quelques genres — typiquement Indie, Action, Adventure et RPG — accaparent l'écrasante majorité des publications. Ce n'est pas un hasard : ces catégories bénéficient d'une demande forte et d'une barrière à l'entrée relativement faible, ce qui attire les développeurs comme des aimants. Le problème est structurel : plus un genre est populaire, plus la concurrence y est féroce, et plus il est difficile d'émerger sans un budget marketing significatif. La longue traîne — ces genres grisés avec moins de publications — offre paradoxalement des niches à fort potentiel, où la demande existe mais l'offre reste insuffisante. Identifier ces zones sous-exploitées est souvent plus stratégique que d'attaquer les genres leaders avec un dixième du budget d'un studio établi.
          </InsightBox>
        </Section>

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
          {activeTab === 'succes'        && <SuccesTab successPct={successPct} />}
          {activeTab === 'tags'          && (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <span className="material-symbols-outlined text-5xl text-muted-foreground/30">psychology</span>
              <p className="font-space-grotesk text-lg font-bold text-muted-foreground/50">Analyse de sentiment</p>
              <p className="font-inter text-xs text-muted-foreground/40 uppercase tracking-widest">Bientôt disponible</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
