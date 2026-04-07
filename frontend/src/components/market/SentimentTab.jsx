/**
 * SentimentTab — "Analyse de sentiment" — Market page
 * Thème aligné sur les autres tabs (CSS vars, Section, InsightBox).
 */

import { useState, useEffect, useCallback } from 'react'
import {
  ScatterChart, Scatter,
  BarChart, Bar,
  Area, AreaChart,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'
import Section from './Section'
import InsightBox from './InsightBox'

const API = import.meta.env.VITE_API_URL

// ── helpers ───────────────────────────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t }

/** Rouge (#E8005A) → gris (#9A9AA8) → cyan (#007A8C) selon mode clair */
function sentimentColor(v) {
  const t = (v + 1) / 2
  if (t < 0.5) {
    const u = t * 2
    return `rgb(${Math.round(lerp(232, 154, u))},${Math.round(lerp(0, 154, u))},${Math.round(lerp(90, 168, u))})`
  }
  const u = (t - 0.5) * 2
  return `rgb(${Math.round(lerp(154, 0, u))},${Math.round(lerp(154, 122, u))},${Math.round(lerp(168, 140, u))})`
}

const fmt = n =>
  typeof n === 'number'
    ? n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000    ? `${(n / 1_000).toFixed(0)}k`
    : n.toLocaleString('fr-FR')
    : n

function fmtMonth(str) {
  if (!str) return ''
  const [y, m] = str.split('-')
  return new Date(+y, +m - 1).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
}

// ── Tooltip partagé ───────────────────────────────────────────────────────────
function ChartTooltip({ children, style }) {
  return (
    <div
      className="shadow-xl"
      style={{
        background: 'var(--wif-bg)',
        border: '1px solid var(--wif-border)',
        padding: '10px 14px',
        fontSize: 12,
        fontFamily: 'Inter, sans-serif',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ── Séparateur de section ─────────────────────────────────────────────────────
function SectionLabel({ icon, label }) {
  return (
    <div className="flex items-center gap-3 mb-4 mt-2">
      <span className="material-symbols-outlined text-muted-foreground" style={{ fontSize: 15 }}>{icon}</span>
      <span className="font-inter text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">{label}</span>
      <div className="flex-1 h-px bg-border/40" />
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ h = 300 }) {
  return <div className="rounded-sm animate-pulse bg-muted" style={{ height: h }} />
}

// ── Chart 1 — Scatter: sentiment vs succès ────────────────────────────────────
function ScatterSentiment({ data, loading }) {
  const chartData = (data || [])
    .map(d => ({
      ...d,
      avg_sentiment:   parseFloat(d.avg_sentiment),
      owners_midpoint: d.owners_midpoint
        ? Math.log10(Math.max(1, parseFloat(d.owners_midpoint)))
        : null,
    }))
    .filter(d => d.owners_midpoint !== null && !isNaN(d.avg_sentiment))

  // Domaines auto depuis les données réelles
  const sentValues = chartData.map(d => d.avg_sentiment)
  const xMin = sentValues.length ? Math.floor((Math.min(...sentValues) - 0.05) * 10) / 10 : -1
  const xMax = sentValues.length ? Math.ceil((Math.max(...sentValues)  + 0.05) * 10) / 10 : 1

  const yValues = chartData.map(d => d.owners_midpoint)
  const yMin = yValues.length ? Math.floor(Math.min(...yValues) * 10) / 10 : 4
  const yMax = yValues.length ? Math.ceil(Math.max(...yValues)  * 10) / 10 : 8

  return (
    <Section
      title="Le sentiment des reviews prédit-il le succès ?"
      subtitle="X = score de sentiment moyen, Y = propriétaires estimés (échelle log)"
    >
      {loading ? <Skeleton h={460} /> : (
        <>
          <ResponsiveContainer width="100%" height={460}>
            <ScatterChart margin={{ top: 10, right: 24, left: 0, bottom: 28 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--wif-border)" />
              <XAxis
                type="number"
                dataKey="avg_sentiment"
                domain={[xMin, xMax]}
                tick={{ fontSize: 12, fill: 'var(--wif-gray)' }}
                label={{ value: 'Score de sentiment moyen', position: 'insideBottom', offset: -16, fontSize: 12, fill: 'var(--wif-gray)' }}
              />
              <YAxis
                type="number"
                dataKey="owners_midpoint"
                domain={[yMin, yMax]}
                tick={{ fontSize: 12, fill: 'var(--wif-gray)' }}
                tickFormatter={v => {
                  const n = Math.round(10 ** v)
                  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}k` : `${n}`
                }}
                label={{ value: 'Propriétaires', angle: -90, position: 'insideLeft', offset: 14, fontSize: 12, fill: 'var(--wif-gray)' }}
              />
              <ReferenceLine
                x={0}
                stroke="var(--wif-border)"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                label={{ value: 'Neutre', position: 'insideTopRight', fontSize: 11, fill: 'var(--wif-gray)' }}
              />
              <Tooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0]?.payload
                  return (
                    <div
                      className="shadow-xl overflow-hidden"
                      style={{
                        background: 'var(--wif-bg)',
                        border: '1px solid var(--wif-border)',
                        width: 240,
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 12,
                      }}
                    >
                      {d?.header_image && (
                        <img
                          src={d.header_image}
                          alt={d.name}
                          style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }}
                        />
                      )}
                      <div style={{ padding: '10px 12px' }}>
                        <p className="font-space-grotesk font-bold text-foreground mb-2" style={{ fontSize: 13 }}>{d?.name}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <p className="text-muted-foreground">
                            Sentiment : <strong style={{ color: sentimentColor(d?.avg_sentiment) }}>{d?.avg_sentiment?.toFixed(3)}</strong>
                          </p>
                          <p className="text-muted-foreground">
                            Propriétaires : <strong style={{ color: 'var(--wif-cyan)' }}>{fmt(Math.round(10 ** d?.owners_midpoint))}</strong>
                          </p>
                          <p className="text-muted-foreground">
                            Avis : <strong className="text-foreground">{fmt(d?.review_count)}</strong>
                          </p>
                          <p className="mt-1 font-bold" style={{ color: d?.is_successful ? 'var(--wif-success)' : 'var(--wif-danger)' }}>
                            {d?.is_successful ? '✓ Succès' : '✗ Flop'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                }}
              />
              <Scatter
                data={chartData}
                isAnimationActive={false}
                shape={({ cx, cy, payload }) => {
                  const isOk = payload.is_successful
                  return (
                    <circle
                      cx={cx} cy={cy}
                      r={isOk ? 8 : 5}
                      fill={isOk ? 'var(--wif-pink)' : 'var(--wif-gray)'}
                      fillOpacity={isOk ? 0.75 : 0.35}
                      stroke={isOk ? 'var(--wif-pink)' : 'var(--wif-gray)'}
                      strokeWidth={isOk ? 1.5 : 1}
                      strokeOpacity={isOk ? 0.5 : 0.3}
                    />
                  )
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
          {/* Légende */}
          <div className="flex gap-5 mt-3">
            {[
              { color: 'var(--wif-pink)', label: 'Succès', r: 8 },
              { color: 'var(--wif-gray)', label: 'Flop',   r: 5 },
            ].map(({ color, label, r }) => (
              <div key={label} className="flex items-center gap-2">
                <svg width={r * 2 + 2} height={r * 2 + 2}>
                  <circle cx={r + 1} cy={r + 1} r={r} fill={color} fillOpacity={0.7} />
                </svg>
                <span className="font-inter text-[11px] uppercase tracking-widest text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
          <InsightBox icon="insights" title="Ce que révèle ce graphique">
            Chaque point représente un jeu. Les points roses (succès) se concentrent-ils à droite ? Si oui, un sentiment positif est corrélé à un plus grand nombre de propriétaires. L'axe Y en échelle logarithmique permet de visualiser à la fois les petits indés et les blockbusters. Les jeux avec beaucoup d'avis négatifs restent-ils cantonnés en bas du graphique ? Si oui, c'est la preuve que le sentiment constitue un signal fiable pour notre modèle de prédiction.
          </InsightBox>
        </>
      )}
    </Section>
  )
}

// ── Chart 2 — Timeline ────────────────────────────────────────────────────────
function SentimentTimeline({ data, loading }) {
  const chartData = (data || []).map(d => ({
    ...d,
    avg_sentiment: parseFloat(d.avg_sentiment),
  }))

  return (
    <Section
      title="Le ton des reviews évolue-t-il dans le temps ?"
      subtitle="Sentiment moyen mensuel (ligne pointillée = neutralité)"
    >
      {loading ? <Skeleton h={400} /> : (
        <>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 28 }}>
              <defs>
                <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--wif-pink)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--wif-pink)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--wif-border)" />
              <XAxis
                dataKey="month"
                tickFormatter={fmtMonth}
                tick={{ fontSize: 11, fill: 'var(--wif-gray)' }}
                angle={-35}
                textAnchor="end"
                height={56}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[-1, 1]}
                tick={{ fontSize: 12, fill: 'var(--wif-gray)' }}
              />
              <ReferenceLine
                y={0}
                stroke="var(--wif-border)"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                label={{ value: 'Neutre', position: 'insideTopRight', fontSize: 11, fill: 'var(--wif-gray)' }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0]?.payload
                  return (
                    <ChartTooltip>
                      <p className="text-muted-foreground mb-1">{fmtMonth(label)}</p>
                      <p style={{ color: sentimentColor(d?.avg_sentiment) }}>
                        Sentiment : <strong>{parseFloat(d?.avg_sentiment).toFixed(3)}</strong>
                      </p>
                      <p className="text-muted-foreground">{d?.review_count?.toLocaleString('fr-FR')} avis</p>
                    </ChartTooltip>
                  )
                }}
              />
              <Area
                type="monotone"
                dataKey="avg_sentiment"
                stroke="var(--wif-pink)"
                strokeWidth={2.5}
                fill="url(#sentGrad)"
                dot={false}
                activeDot={{ r: 6, fill: 'var(--wif-pink)', stroke: 'var(--wif-bg)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
          <InsightBox icon="show_chart" title="Lire la courbe temporelle">
            Une courbe qui reste au-dessus de 0 indique que les joueurs ont globalement bien accueilli les sorties de cette période. Les baisses marquées coïncident souvent avec des controverses : monétisation agressive, lancements ratés. Une tendance générale à la hausse peut refléter une amélioration continue de la qualité, ou des attentes mieux calibrées avec le temps.
          </InsightBox>
        </>
      )}
    </Section>
  )
}

// ── Chart 3 — Sentiment par genre (pleine largeur, compact) ───────────────────
function GenreSentimentBar({ data, loading }) {
  const sorted = [...(data || [])]
    .map(d => ({ ...d, avg_sentiment: parseFloat(d.avg_sentiment) }))
    .filter(d => !isNaN(d.avg_sentiment))
    .sort((a, b) => a.avg_sentiment - b.avg_sentiment)

  const BAR_H   = 22
  const barHeight = Math.min(Math.max(200, sorted.length * BAR_H), 400)

  const minVal = sorted.length ? Math.min(sorted[0].avg_sentiment - 0.02, -0.01) : -1
  const maxVal = sorted.length ? Math.max(sorted[sorted.length - 1].avg_sentiment + 0.02, 0.01) : 1

  return (
    <Section
      title="Quel genre divise le plus les joueurs ?"
      subtitle="Score de sentiment moyen par genre (trié du plus négatif au plus positif)"
      badge={`${sorted.length} genres`}
    >
      {loading ? <Skeleton h={barHeight} /> : (
        <>
          <ResponsiveContainer width="100%" height={barHeight}>
            <BarChart
              layout="vertical"
              data={sorted}
              margin={{ top: 4, right: 52, left: 8, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--wif-border)" horizontal={false} />
              <XAxis
                type="number"
                domain={[minVal, maxVal]}
                tick={{ fontSize: 12, fill: 'var(--wif-gray)' }}
              />
              <YAxis
                type="category"
                dataKey="genre_name"
                width={100}
                tick={{ fontSize: 12, fill: 'var(--wif-gray)' }}
              />
              <ReferenceLine x={0} stroke="var(--wif-border)" strokeWidth={1.5} strokeDasharray="4 2" />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0]?.payload
                  return (
                    <ChartTooltip>
                      <p className="font-space-grotesk font-bold text-foreground mb-1">{d?.genre_name}</p>
                      <p style={{ color: sentimentColor(d?.avg_sentiment) }}>
                        Sentiment moyen : {d?.avg_sentiment?.toFixed(3)}
                      </p>
                      <p className="text-muted-foreground">
                        Avis positifs : {((d?.positive_ratio || 0) * 100).toFixed(0)}%
                      </p>
                      <p className="text-muted-foreground">
                        Avis analysés : {d?.review_count?.toLocaleString('fr-FR')}
                      </p>
                    </ChartTooltip>
                  )
                }}
              />
              <Bar dataKey="avg_sentiment" maxBarSize={16} radius={[0, 2, 2, 0]}>
                {sorted.map((entry, i) => (
                  <Cell key={i} fill={sentimentColor(entry.avg_sentiment)} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <InsightBox icon="category" title="Lire ce classement">
            Les genres en bas reçoivent les avis les plus sévères (souvent des attentes élevées non satisfaites). Un score proche de 0 peut masquer une forte polarisation. Les genres en tête bénéficient d'un capital sympathie favorable pour un nouveau lancement.
          </InsightBox>
        </>
      )}
    </Section>
  )
}

// ── Chart 4 — Word Clouds ─────────────────────────────────────────────────────
const POS_COLORS = ['#007A8C', '#00968A', '#007A4C', '#005C8C', '#006699']
const NEG_COLORS = ['#E8005A', '#CC1A1A', '#B5004A', '#993300', '#CC4400']

function CssWordCloud({ words, colors }) {
  if (!words?.length) {
    return (
      <div className="flex items-center justify-center text-muted-foreground text-sm" style={{ height: 240 }}>
        Aucun mot disponible
      </div>
    )
  }
  const maxVal = Math.max(...words.map(w => w.value))
  const minVal = Math.min(...words.map(w => w.value))
  const range  = maxVal - minVal || 1

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignContent: 'center', justifyContent: 'center', gap: '6px 10px', height: 240, overflow: 'hidden', padding: '8px 0' }}>
      {words.slice(0, 60).map((w, i) => {
        const t    = (w.value - minVal) / range
        const size = Math.round(12 + t * 32)
        return (
          <span
            key={w.text}
            title={`${w.text}: ${w.value}`}
            style={{
              fontSize: size,
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: t > 0.6 ? 700 : t > 0.3 ? 600 : 400,
              color: colors[i % colors.length],
              opacity: 0.6 + t * 0.4,
              lineHeight: 1.1,
              cursor: 'default',
            }}
          >
            {w.text}
          </span>
        )
      })}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export function SentimentTab() {
  const [gamesData,    setGamesData]    = useState(null)
  const [wordData,     setWordData]     = useState(null)
  const [genreData,    setGenreData]    = useState(null)
  const [timelineData, setTimelineData] = useState(null)

  const [loadingGames,    setLoadingGames]    = useState(true)
  const [loadingWords,    setLoadingWords]    = useState(true)
  const [loadingGenre,    setLoadingGenre]    = useState(true)
  const [loadingTimeline, setLoadingTimeline] = useState(true)

  const fetchAll = useCallback(async () => {
    const safe = async (url, setter, setLoading) => {
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`${res.status}`)
        setter(await res.json())
      } catch (e) {
        console.warn('Sentiment fetch error:', url, e.message)
        setter(null)
      } finally {
        setLoading(false)
      }
    }
    safe(`${API}/sentiment/games`,     setGamesData,    setLoadingGames)
    safe(`${API}/sentiment/wordcloud`, setWordData,     setLoadingWords)
    safe(`${API}/sentiment/by-genre`,  setGenreData,    setLoadingGenre)
    safe(`${API}/sentiment/timeline`,  setTimelineData, setLoadingTimeline)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  return (
    <div className="space-y-8">

      {/* ── INTRO ──────────────────────────────────────────────────────────── */}
      <div className="bg-card border border-border/30 p-6" style={{ borderLeft: '4px solid var(--wif-pink)' }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--wif-pink)' }}>psychology</span>
          <span className="font-inter text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Qu'est-ce que l'analyse de sentiment ?
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="font-inter text-sm text-muted-foreground leading-relaxed mb-3">
              L'analyse de sentiment est une technique de traitement du langage naturel (NLP) qui attribue un score numérique à un texte pour quantifier s'il exprime une opinion{' '}
              <strong className="text-foreground">positive</strong>, <strong className="text-foreground">neutre</strong> ou <strong className="text-foreground">négative</strong>.
              Pour ce catalogue, chaque avis Steam est analysé avec l'algorithme <strong className="text-foreground">VADER</strong>{' '}
              (Valence Aware Dictionary and sEntiment Reasoner), conçu pour les textes courts et informels de type réseaux sociaux ou critiques en ligne.
            </p>
            <p className="font-inter text-sm text-muted-foreground leading-relaxed">
              Le score varie de{' '}
              <strong style={{ color: 'var(--wif-pink)' }}>−1</strong> (sentiment très négatif) à{' '}
              <strong style={{ color: 'var(--wif-cyan)' }}>+1</strong> (très positif),
              0 représentant la neutralité parfaite. Pour chaque jeu, nous agrégeons l'ensemble de ses avis pour obtenir un score moyen représentatif de la perception globale de la communauté.
            </p>
          </div>
          <div>
            <p className="font-inter text-sm text-muted-foreground leading-relaxed mb-3">
              Dans le cadre de <strong className="text-foreground">Will it Flop</strong>, l'analyse de sentiment joue un rôle clé dans la prédiction du succès commercial. L'hypothèse centrale : un jeu qui suscite des avis enthousiastes génère du bouche-à-oreille positif, fidélise sa communauté et attire de nouveaux acheteurs. Ce qui se traduit directement en propriétaires estimés et en chiffre d'affaires.
            </p>
            <p className="font-inter text-sm text-muted-foreground leading-relaxed">
              Les visualisations ci-dessous explorent cette corrélation sous plusieurs angles : relation directe sentiment/succès, dynamique temporelle du ton des avis, disparités entre genres, et enfin le vocabulaire réel utilisé par les joueurs pour exprimer satisfaction ou déception.
            </p>
          </div>
        </div>
      </div>

      {/* ── SECTION 1 — Scatter (full-width) ───────────────────────────────── */}
      <div>
        <SectionLabel icon="scatter_plot" label="Corrélation sentiment & succès" />
        <ScatterSentiment data={gamesData} loading={loadingGames} />
      </div>

      {/* ── SECTION 2 — Timeline + Genre côte à côte ───────────────────────── */}
      <div>
        <SectionLabel icon="category" label="Tendances temporelles & sentiment par genre" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SentimentTimeline data={timelineData} loading={loadingTimeline} />
          </div>
          <div className="lg:col-span-1">
            <GenreSentimentBar data={genreData} loading={loadingGenre} />
          </div>
        </div>
      </div>

      {/* ── SECTION 3 — Word clouds ─────────────────────────────────────────── */}
      <div>
        <SectionLabel icon="cloud" label="Vocabulaire des avis joueurs" />
        <p className="font-inter text-sm text-muted-foreground leading-relaxed mb-5 max-w-3xl">
          Ces nuages de mots extraient les termes les plus récurrents dans les avis classifiés positifs ou négatifs, après suppression des stopwords. La taille de chaque mot est proportionnelle à sa fréquence d'apparition. Ils révèlent les thématiques qui reviennent le plus souvent dans les retours joueurs.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Section
            title="Ce que les joueurs adorent"
            subtitle="Mots les plus fréquents dans les avis positifs"
          >
            {loadingWords ? <Skeleton h={240} /> : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full" style={{ background: 'var(--wif-cyan)' }} />
                  <span className="font-inter text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--wif-cyan)' }}>
                    {wordData?.positive?.length ?? 0} mots
                  </span>
                </div>
                <CssWordCloud words={wordData?.positive || []} colors={POS_COLORS} />
                <InsightBox icon="sentiment_very_satisfied" title="Signaux positifs">
                  Les mots qui ressortent trahissent ce que les joueurs valorisent réellement : histoire immersive, gameplay fluide, bon rapport qualité-prix, communauté soudée. Ces éléments constituent des leviers concrets pour maximiser la satisfaction et la rétention.
                </InsightBox>
              </>
            )}
          </Section>
          <Section
            title="Ce qui déçoit les joueurs"
            subtitle="Mots les plus fréquents dans les avis négatifs"
          >
            {loadingWords ? <Skeleton h={240} /> : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full" style={{ background: 'var(--wif-pink)' }} />
                  <span className="font-inter text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--wif-pink)' }}>
                    {wordData?.negative?.length ?? 0} mots
                  </span>
                </div>
                <CssWordCloud words={wordData?.negative || []} colors={NEG_COLORS} />
                <InsightBox icon="sentiment_very_dissatisfied" title="Signaux négatifs">
                  Le vocabulaire des avis négatifs est souvent direct : bugs, crashes, prix excessif, contenu insuffisant, manque de support. Ces termes récurrents dessinent un tableau fidèle des attentes non satisfaites et des écueils à anticiper.
                </InsightBox>
              </>
            )}
          </Section>
        </div>
      </div>

    </div>
  )
}
