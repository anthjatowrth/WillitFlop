import { useState } from 'react'
import {
  ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea,
} from 'recharts'
import { useTagAnalytics } from '../../hooks/useTagAnalytics'
import { ChartCard } from '../database/TagAnalytics'
import Section from './Section'
import InsightBox from './InsightBox'

const fmt = n => typeof n === 'number' ? n.toLocaleString('fr-FR') : n

function rateColor(r) {
  if (r >= 50) return '#007A4C'
  if (r >= 35) return '#E67E22'
  return '#CC1A1A'
}

const TAG_CATS = [
  { key: 'ambiance', label: 'Ambiance',  color: '#9B59B6' },
  { key: 'gameplay', label: 'Gameplay',  color: '#007A8C' },
  { key: 'visual',   label: 'Visuel',    color: '#E67E22' },
  { key: 'camera',   label: 'Caméra',    color: '#4A90E2' },
]

const CHARTS_CONFIG = [
  { key: 'genre',    step: 'Q1 / 6', title: 'Famille de ton jeu',     subtitle: 'Genres Steam — volume et taux de succès',          color: '#E8005A' },
  { key: 'ambiance', step: 'Q2 / 6', title: 'Ambiance de l\'univers', subtitle: "Tags d'univers — volume et taux de succès",        color: '#9B59B6' },
  { key: 'gameplay', step: 'Q3 / 6', title: 'Comment joue-t-on ?',   subtitle: 'Mécaniques & gameplay — volume et taux de succès', color: '#007A8C' },
  { key: 'visual',   step: 'Q4 / 6', title: 'Style graphique',        subtitle: 'Tags visuels — volume et taux de succès',          color: '#E67E22' },
  { key: 'camera',   step: 'Q5 / 6', title: 'Vue caméra principale',  subtitle: 'Tags perspective — volume et taux de succès',      color: '#4A90E2' },
  { key: 'playmode', step: 'Q6 / 6', title: 'Mode de jeu',            subtitle: 'Catégories Steam — volume et taux de succès',      color: '#007A4C' },
]

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

export default function SuccesTab({ successPct }) {
  const { data: tagData, loading: tagLoading } = useTagAnalytics()
  const [selectedChart, setSelectedChart] = useState(0)

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

  const rawRates   = allLogTags.map(t => t.successRate)
  const minRate    = allLogTags.length > 0 ? Math.max(0,   Math.min(...rawRates) - 4) : 0
  const maxRate    = allLogTags.length > 0 ? Math.min(100, Math.max(...rawRates) + 8) : 100
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

                <ReferenceArea
                  x1={minLogCount} x2={avgLogCount} y1={medianRate} y2={maxRate}
                  fill="#007A4C" fillOpacity={0.13}
                  label={{ value: 'Niche Efficace', position: 'insideTopLeft', fontSize: 13, fill: '#007A4C', fillOpacity: 0.90, fontWeight: 700, opacity: 0.90 }}
                />
                <ReferenceArea
                  x1={avgLogCount} x2={maxLogCount} y1={medianRate} y2={maxRate}
                  fill="#E8005A" fillOpacity={0.13}
                  label={{ value: '★ Stars', position: 'insideTopRight', fontSize: 13, fill: '#E8005A', fontWeight: 700, opacity: 0.90 }}
                />
                <ReferenceArea
                  x1={minLogCount} x2={avgLogCount} y1={minRate} y2={medianRate}
                  fill="#888" fillOpacity={0.08}
                  label={{ value: 'Zone Morte', position: 'insideBottomLeft', fontSize: 13, fill: '#888', fontWeight: 700, opacity: 0.90 }}
                />
                <ReferenceArea
                  x1={avgLogCount} x2={maxLogCount} y1={minRate} y2={medianRate}
                  fill="#E67E22" fillOpacity={0.12}
                  label={{ value: 'Piège Populaire', position: 'insideBottomRight', fontSize: 13, fill: '#E67E22', fontWeight: 700, opacity: 0.90 }}
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
          Ce graphique est probablement le plus utile de toute l'application. Chaque point représente un tag, positionné selon deux axes : sa popularité (combien de jeux le portent) et son taux de succès historique. Les <strong>Stars</strong> en haut à droite sont populaires et performantes, mais aussi très compétitives. Les <strong>Niches Efficaces</strong> en haut à gauche sont les vraies pépites : peu de jeux les portent, mais ceux qui le font réussissent souvent. Le <strong>Piège Populaire</strong> en bas à droite, c'est la zone à éviter : des caractéristiques répandues dont le taux de succès reste faible, souvent parce que le marché est saturé. La <strong>Zone Morte</strong> regroupe les tags rares et peu performants. En pratique, le meilleur positionnement combine une "Star" pour la crédibilité et une "Niche Efficace" pour se distinguer.
        </InsightBox>
      </Section>

      {/* ── Graphiques par catégorie de tag — sélecteur interactif ── */}
      <Section
        title="Analyse par catégorie de tags"
        subtitle="Sélectionnez une dimension pour explorer le volume et le taux de succès"
      >
        <div className="flex flex-wrap gap-2 mb-5">
          {CHARTS_CONFIG.map((c, i) => (
            <button
              key={c.key}
              onClick={() => setSelectedChart(i)}
              className={`px-3 py-1.5 font-inter text-xs font-bold uppercase tracking-widest border transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                selectedChart !== i ? 'hover:border-primary/50 hover:text-foreground' : ''
              }`}
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
          Chaque dimension raconte quelque chose de différent sur ce que les joueurs apprécient vraiment. Certaines mécaniques affichent des taux de succès nettement au-dessus de la moyenne, non pas parce qu'elles seraient objectivement "meilleures", mais parce qu'elles répondent aux attentes documentées d'une communauté précise. À l'inverse, des approches très courantes peuvent souffrir d'un excès d'offre : le marché est saturé, les joueurs deviennent sélectifs. L'enjeu pour tout créateur n'est pas de cocher les tags populaires pour plaire à l'algorithme, mais de comprendre quels assemblages de caractéristiques créent quelque chose d'unique. C'est là que naît un positionnement qui parle vraiment, que ce soit aux joueurs ou à un éditeur.
        </InsightBox>
      </Section>

    </div>
  )
}
