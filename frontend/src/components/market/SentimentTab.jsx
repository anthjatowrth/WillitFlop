/**
 * SentimentTab — "Analyse de sentiment" content for the Market page.
 *
 * Charts:
 *  1. ScatterChart  — Sentiment vs Success
 *  2. WordCloud     — Top words (positive / negative toggle)
 *  3. BarChart      — Avg sentiment by genre (horizontal)
 *  4. LineChart     — Sentiment timeline
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ScatterChart, Scatter,
  BarChart, Bar,
  Area, AreaChart,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'

const API = import.meta.env.VITE_API_URL

// ── helpers ──────────────────────────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t }

function sentimentColor(v) {
  // -1 → #E8005A,  0 → #888,  +1 → #00C2FF
  const t = (v + 1) / 2
  if (t < 0.5) {
    const u = t * 2
    return `rgb(${Math.round(lerp(232, 136, u))},${Math.round(lerp(0, 136, u))},${Math.round(lerp(90, 136, u))})`
  }
  const u = (t - 0.5) * 2
  return `rgb(${Math.round(lerp(136, 0, u))},${Math.round(lerp(136, 194, u))},${Math.round(lerp(136, 255, u))})`
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

// ── Loading skeleton ──────────────────────────────────────────────────────────
function Skeleton({ h = 320 }) {
  return (
    <div
      className="rounded-sm animate-pulse"
      style={{ height: h, background: 'rgba(255,255,255,0.04)' }}
    />
  )
}

// ── Card wrapper ──────────────────────────────────────────────────────────────
function SentimentCard({ title, subtitle, children, loading }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ boxShadow: '0 0 24px rgba(0,194,255,0.10)' }}
      style={{
        background: '#0D0D1A',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 2,
        padding: '24px',
      }}
    >
      <h3
        style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 4 }}
      >
        {title}
      </h3>
      {subtitle && (
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
          {subtitle}
        </p>
      )}
      {loading ? <Skeleton /> : children}
    </motion.div>
  )
}

// ── Chart 1 — Scatter: sentiment vs success ───────────────────────────────────
function ScatterSentiment({ data, loading }) {
  const chartData = (data || []).map(d => ({
    ...d,
    owners_midpoint: d.owners_midpoint ? Math.log10(Math.max(1, d.owners_midpoint)) : null,
  }))

  return (
    <SentimentCard
      title="Le sentiment des reviews prédit-il le succès ?"
      subtitle="X = score de sentiment moyen · Y = propriétaires estimés (log) · rouge = succès"
      loading={loading}
    >
      <ResponsiveContainer width="100%" height={340}>
        <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            type="number"
            dataKey="avg_sentiment"
            domain={[-1, 1]}
            tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.4)' }}
            label={{ value: 'Score de sentiment', position: 'insideBottom', offset: -12, fontSize: 12, fill: 'rgba(255,255,255,0.4)' }}
          />
          <YAxis
            type="number"
            dataKey="owners_midpoint"
            tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.4)' }}
            tickFormatter={v => {
              const n = Math.round(10 ** v)
              return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}k` : `${n}`
            }}
            label={{ value: 'Propriétaires', angle: -90, position: 'insideLeft', offset: 14, fontSize: 12, fill: 'rgba(255,255,255,0.4)' }}
          />
          <ReferenceLine
            x={0}
            stroke="rgba(255,255,255,0.2)"
            strokeDasharray="6 3"
            label={{ value: 'Neutre', position: 'insideTopRight', fontSize: 11, fill: 'rgba(255,255,255,0.35)' }}
          />
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d = payload[0]?.payload
              return (
                <div style={{ background: '#0D0D1A', border: `2px solid ${d?.is_successful ? '#E8005A' : '#555'}`, padding: '10px 14px', fontSize: 12 }}>
                  <p style={{ fontWeight: 700, color: '#fff', marginBottom: 6 }}>{d?.name}</p>
                  <p style={{ color: 'rgba(255,255,255,0.5)' }}>Sentiment : <strong style={{ color: sentimentColor(d?.avg_sentiment) }}>{d?.avg_sentiment?.toFixed(3)}</strong></p>
                  <p style={{ color: 'rgba(255,255,255,0.5)' }}>Propriétaires : <strong style={{ color: '#00C2FF' }}>{fmt(Math.round(10 ** d?.owners_midpoint))}</strong></p>
                  <p style={{ color: 'rgba(255,255,255,0.5)' }}>Avis : <strong style={{ color: '#fff' }}>{d?.review_count}</strong></p>
                </div>
              )
            }}
          />
          <Scatter
            data={chartData}
            shape={({ cx, cy, payload }) => (
              <circle
                cx={cx} cy={cy} r={6}
                fill={payload.is_successful ? '#E8005A' : '#444'}
                fillOpacity={payload.is_successful ? 0.85 : 0.6}
                stroke={payload.is_successful ? '#E8005A' : '#666'}
                strokeWidth={payload.is_successful ? 2 : 1}
                strokeOpacity={0.4}
              />
            )}
          />
        </ScatterChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
        {[{ color: '#E8005A', label: 'Succès' }, { color: '#444', label: 'Flop' }].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
          </div>
        ))}
      </div>
    </SentimentCard>
  )
}

// ── Chart 2 — CSS WordCloud (no external lib, React 19 compatible) ────────────
const POS_COLORS = ['#00C2FF', '#00D4BB', '#00E899', '#00FF99', '#00CCAA']
const NEG_COLORS = ['#E8005A', '#F03070', '#FF5038', '#FF7A00', '#FF8800']

function CssWordCloud({ words, colors }) {
  if (!words?.length) {
    return (
      <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
        Aucun mot disponible
      </div>
    )
  }
  const maxVal = Math.max(...words.map(w => w.value))
  const minVal = Math.min(...words.map(w => w.value))
  const range  = maxVal - minVal || 1

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignContent: 'center', justifyContent: 'center', gap: '6px 10px', height: 280, overflow: 'hidden', padding: '8px 0' }}>
      {words.slice(0, 60).map((w, i) => {
        const t    = (w.value - minVal) / range          // 0–1 relative frequency
        const size = Math.round(12 + t * 36)             // 12px → 48px
        const col  = colors[i % colors.length]
        return (
          <span
            key={w.text}
            title={`${w.text}: ${w.value}`}
            style={{
              fontSize: size,
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: t > 0.6 ? 700 : t > 0.3 ? 600 : 400,
              color: col,
              opacity: 0.55 + t * 0.45,
              lineHeight: 1.1,
              cursor: 'default',
              transition: 'opacity 0.15s',
            }}
          >
            {w.text}
          </span>
        )
      })}
    </div>
  )
}

function WordCloudSection({ data, loading }) {
  const [mode, setMode] = useState('positive')
  const words  = mode === 'positive' ? (data?.positive || []) : (data?.negative || [])
  const colors = mode === 'positive' ? POS_COLORS : NEG_COLORS

  return (
    <SentimentCard
      title="Ce que les joueurs retiennent"
      subtitle="Mots les plus fréquents dans les avis — hors stopwords Steam"
      loading={loading}
    >
      {/* Toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { key: 'positive', label: 'Avis positifs', activeColor: '#00C2FF' },
          { key: 'negative', label: 'Avis négatifs', activeColor: '#E8005A' },
        ].map(({ key, label, activeColor }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            style={{
              padding: '6px 18px',
              fontSize: 11,
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              border: `1px solid ${mode === key ? activeColor : 'rgba(255,255,255,0.12)'}`,
              background: mode === key ? `${activeColor}18` : 'transparent',
              color: mode === key ? activeColor : 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              borderRadius: 2,
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.25 }}
        >
          <CssWordCloud words={words} colors={colors} />
        </motion.div>
      </AnimatePresence>
    </SentimentCard>
  )
}

// ── Chart 3 — Horizontal bar: sentiment by genre ──────────────────────────────
function GenreSentimentBar({ data, loading }) {
  const sorted = [...(data || [])].sort((a, b) => a.avg_sentiment - b.avg_sentiment)

  return (
    <SentimentCard
      title="Quel genre divise le plus les joueurs ?"
      subtitle="Score de sentiment moyen par genre Steam · rouge = négatif · bleu = positif"
      loading={loading}
    >
      <ResponsiveContainer width="100%" height={Math.max(260, sorted.length * 28)}>
        <BarChart
          layout="vertical"
          data={sorted}
          margin={{ top: 4, right: 40, left: 8, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
          <XAxis
            type="number"
            domain={[-1, 1]}
            tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.4)' }}
          />
          <YAxis
            type="category"
            dataKey="genre_name"
            width={90}
            tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.5)' }}
          />
          <ReferenceLine x={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 2" />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d = payload[0]?.payload
              return (
                <div style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.12)', padding: '10px 14px', fontSize: 12 }}>
                  <p style={{ fontWeight: 700, color: '#fff', marginBottom: 4 }}>{d?.genre_name}</p>
                  <p style={{ color: sentimentColor(d?.avg_sentiment) }}>Sentiment : {d?.avg_sentiment?.toFixed(3)}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)' }}>Avis positifs : {((d?.positive_ratio || 0) * 100).toFixed(0)}%</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)' }}>Avis analysés : {d?.review_count?.toLocaleString('fr-FR')}</p>
                </div>
              )
            }}
          />
          <Bar dataKey="avg_sentiment" maxBarSize={18} radius={[0, 3, 3, 0]}>
            {sorted.map((entry, i) => (
              <Cell key={i} fill={sentimentColor(entry.avg_sentiment)} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </SentimentCard>
  )
}

// ── Chart 4 — Timeline ────────────────────────────────────────────────────────
function SentimentTimeline({ data, loading }) {
  return (
    <SentimentCard
      title="Le ton des reviews évolue-t-il ?"
      subtitle="Sentiment moyen par mois · ligne rouge = neutralité"
      loading={loading}
    >
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data || []} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
          <defs>
            <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#E8005A" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#E8005A" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="month"
            tickFormatter={fmtMonth}
            tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }}
            angle={-30}
            textAnchor="end"
            height={50}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[-1, 1]}
            tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.4)' }}
          />
          <ReferenceLine
            y={0}
            stroke="rgba(255,255,255,0.2)"
            strokeDasharray="6 3"
            label={{ value: 'Neutre', position: 'insideTopRight', fontSize: 11, fill: 'rgba(255,255,255,0.3)' }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              const d = payload[0]?.payload
              return (
                <div style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.12)', padding: '10px 14px', fontSize: 12 }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{fmtMonth(label)}</p>
                  <p style={{ color: sentimentColor(d?.avg_sentiment) }}>
                    Sentiment : <strong>{parseFloat(d?.avg_sentiment).toFixed(3)}</strong>
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {d?.review_count?.toLocaleString('fr-FR')} avis
                  </p>
                </div>
              )
            }}
          />
          <Area
            type="monotone"
            dataKey="avg_sentiment"
            stroke="#E8005A"
            strokeWidth={2.5}
            fill="url(#sentGrad)"
            dot={false}
            activeDot={{ r: 6, fill: '#E8005A', stroke: '#0D0D1A', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </SentimentCard>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export function SentimentTab() {
  const [gamesData,   setGamesData]   = useState(null)
  const [wordData,    setWordData]    = useState(null)
  const [genreData,   setGenreData]   = useState(null)
  const [timelineData, setTimelineData] = useState(null)

  const [loadingGames,    setLoadingGames]    = useState(true)
  const [loadingWords,    setLoadingWords]    = useState(true)
  const [loadingGenre,    setLoadingGenre]    = useState(true)
  const [loadingTimeline, setLoadingTimeline] = useState(true)

  const fetchAll = useCallback(async () => {
    const base = API

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

    safe(`${base}/sentiment/games`,      setGamesData,    setLoadingGames)
    safe(`${base}/sentiment/wordcloud`,  setWordData,     setLoadingWords)
    safe(`${base}/sentiment/by-genre`,   setGenreData,    setLoadingGenre)
    safe(`${base}/sentiment/timeline`,   setTimelineData, setLoadingTimeline)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 24 }}>
      <ScatterSentiment  data={gamesData}    loading={loadingGames} />
      <WordCloudSection  data={wordData}     loading={loadingWords} />
      <GenreSentimentBar data={genreData}    loading={loadingGenre} />
      <SentimentTimeline data={timelineData} loading={loadingTimeline} />
    </div>
  )
}
