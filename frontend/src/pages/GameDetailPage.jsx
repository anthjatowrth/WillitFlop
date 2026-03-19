import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Hls from 'hls.js'
import { supabase } from '../api/client'
import { getScoreAccent } from '../utils/scoreColor'

// ── Formatting helpers ────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return 'TBA'
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatMinutes(minutes) {
  if (!minutes) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

function formatOwners(midpoint) {
  if (!midpoint) return '—'
  if (midpoint >= 1_000_000) return `${(midpoint / 1_000_000).toFixed(1)}M`
  if (midpoint >= 1_000) return `${(midpoint / 1_000).toFixed(0)}K`
  return midpoint.toString()
}

function formatPrice(isF, priceEur) {
  if (isF) return 'Free to Play'
  if (!priceEur) return '—'
  return `€${priceEur.toFixed(2)}`
}

// ── Sub-components ────────────────────────────────────────────────────────

/** Section header with left primary border — matches LeaderboardPage style */
function SectionLabel({ children }) {
  return (
    <div className="font-label text-[10px] tracking-[0.35em] uppercase text-primary mb-4">
      {children}
    </div>
  )
}

/** Single stat row in the sidebar */
function StatRow({ icon, label, value, accent = false }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{icon}</span>
        <span className="font-label text-[10px] tracking-widest uppercase">{label}</span>
      </div>
      <span
        className="font-headline font-bold text-sm"
        style={{ color: accent ? 'var(--primary)' : 'var(--foreground)' }}
      >
        {value}
      </span>
    </div>
  )
}

/** Review bar — positive / negative split */
function ReviewBar({ positive, total }) {
  if (!total) return null
  const pct = Math.round((positive / total) * 100)
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="font-label text-[9px] tracking-widest uppercase text-muted-foreground">
          Community Score
        </span>
        <span className="font-label text-[9px] tracking-widest uppercase font-bold"
          style={{ color: pct >= 70 ? 'var(--wif-success)' : pct >= 50 ? 'var(--wif-warn)' : 'var(--wif-danger)' }}
        >
          {pct}% positive
        </span>
      </div>
      <div className="h-1.5 bg-surface-container-high overflow-hidden">
        <div
          className="h-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: pct >= 70 ? 'var(--wif-success)' : pct >= 50 ? 'var(--wif-warn)' : 'var(--wif-danger)',
          }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="font-label text-[8px] text-muted-foreground/60">
          ↑ {positive.toLocaleString()}
        </span>
        <span className="font-label text-[8px] text-muted-foreground/60">
          ↓ {(total - positive).toLocaleString()}
        </span>
      </div>
    </div>
  )
}

/** Metacritic score display — large format */
function MetacriticBlock({ score }) {
  const accent = getScoreAccent(score)
  if (!accent) return (
    <div className="flex flex-col items-center justify-center py-3 border border-border">
      <span className="font-label text-[9px] tracking-widest uppercase text-muted-foreground">Metacritic</span>
      <span className="font-headline text-2xl font-black text-muted-foreground/30 mt-1">N/A</span>
    </div>
  )
  return (
    <div
      className="flex flex-col items-center justify-center py-3 border"
      style={{ borderColor: `var(--${accent})` }}
    >
      <span
        className="font-label text-[9px] tracking-widest uppercase"
        style={{ color: `var(--${accent})` }}
      >
        Metacritic
      </span>
      <span
        className="font-headline text-4xl font-black mt-1 leading-none"
        style={{ color: `var(--${accent})` }}
      >
        {score}
      </span>
    </div>
  )
}

/** Skeleton placeholder */
function Skeleton({ className = '' }) {
  return <div className={`bg-surface-container-high animate-pulse ${className}`} />
}

/** HLS video player for Steam trailers */
function GameTrailer({ hlsUrl, posterUrl }) {
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !hlsUrl) return

    if (hlsUrl.endsWith('.m3u8') && Hls.isSupported()) {
      const hls = new Hls()
      hls.loadSource(hlsUrl)
      hls.attachMedia(video)
      return () => hls.destroy()
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      video.src = hlsUrl
    } else {
      // Fallback: try direct src (webm/mp4)
      video.src = hlsUrl
    }
  }, [hlsUrl])

  if (!hlsUrl) return null

  return (
    <section>
      <SectionLabel>Trailer</SectionLabel>
      <div className="overflow-hidden border border-border" style={{ aspectRatio: '16/9' }}>
        <video
          ref={videoRef}
          poster={posterUrl}
          controls
          muted
          className="w-full h-full object-cover"
        />
      </div>
    </section>
  )
}

/** Screenshots gallery — thumbnails in a row, hover to enlarge */
function ScreenshotGallery({ urls }) {
  const [active, setActive] = useState(null)
  if (!urls?.length) return null

  return (
    <section>
      <SectionLabel>Screenshots</SectionLabel>
      <div className="flex flex-col gap-3">
        {/* Enlarged preview */}
        {active && (
          <div className="overflow-hidden border border-border">
            <img
              src={active}
              alt="Screenshot"
              className="w-full object-cover transition-all duration-300"
              style={{ aspectRatio: '16/9' }}
            />
          </div>
        )}
        {/* Thumbnail strip */}
        <div className="flex gap-2 flex-wrap">
          {urls.map((url, i) => (
            <div
              key={url}
              className="overflow-hidden border border-border cursor-pointer transition-all duration-200"
              style={{ width: 'calc(20% - 0.4rem)', aspectRatio: '16/9' }}
              onMouseEnter={() => setActive(url)}
              onMouseLeave={() => setActive(null)}
            >
              <img
                src={url}
                alt={`Screenshot ${i + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function GameDetailPage() {
  const { appId } = useParams()
  const navigate   = useNavigate()

  const [game, setGame]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    supabase
      .from('games')
      .select(`
        *,
        game_genres(genre_name),
        game_tags(tag_name, votes),
        game_categories(category_name)
      `)
      .eq('app_id', appId)
      .single()
      .then(({ data, error: err }) => {
        if (err) setError(err)
        else setGame(data)
        setLoading(false)
      })
  }, [appId])

  // ── Loading state ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="linear-grid min-h-full">
        <Skeleton className="w-full h-72" />
        <div className="max-w-screen-2xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="w-full" style={{ aspectRatio: '16/9' }} />
          </div>
          <div className="flex flex-col gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    )
  }

  // ── Error state ──────────────────────────────────────────────────────
  if (error || !game) {
    return (
      <div className="linear-grid min-h-full flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-muted-foreground">error</span>
          <p className="font-headline font-bold mt-3 text-foreground">Game not found</p>
          <p className="font-inter text-sm text-muted-foreground mt-1 mb-6">
            {error?.message ?? 'No entry with this ID in the database.'}
          </p>
          <button
            onClick={() => navigate('/database')}
            className="px-5 py-2 bg-primary text-primary-foreground font-bold text-xs font-label tracking-widest uppercase"
          >
            Back to Catalogue
          </button>
        </div>
      </div>
    )
  }

  // ── Derived values ───────────────────────────────────────────────────
  const genres     = game.game_genres?.map(r => r.genre_name) ?? []
  const tags       = [...(game.game_tags ?? [])].sort((a, b) => b.votes - a.votes).slice(0, 12)
  const categories = game.game_categories?.map(r => r.category_name) ?? []

  const isNew = (() => {
    if (!game.fetched_at) return false
    const ago = new Date(); ago.setDate(ago.getDate() - 30)
    return new Date(game.fetched_at) > ago
  })()

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="linear-grid min-h-full">

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden" style={{ minHeight: '320px' }}>

        {/* Background image */}
        {game.header_image
          ? <img
              src={game.header_image}
              alt={game.name}
              className="absolute inset-0 w-full h-full object-cover scale-105 blur-sm"
            />
          : <div className="absolute inset-0 bg-surface-container-high" />
        }

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30" />
        <div className="absolute inset-0 linear-grid opacity-30" />

        {/* Content */}
        <div className="relative max-w-screen-2xl mx-auto px-6 py-10 flex flex-col justify-end h-full" style={{ minHeight: '320px' }}>

          {/* Breadcrumb + back */}
          <button
            onClick={() => navigate('/database')}
            className="flex items-center gap-1.5 font-label text-[10px] tracking-widest uppercase text-white/60 hover:text-white transition-colors mb-6 self-start"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_back</span>
            Game_Database.Log
          </button>

          {/* Status + new badges */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className="px-2 py-0.5 text-[9px] font-bold font-label tracking-widest uppercase"
              style={{
                background: game.is_successful ? 'var(--wif-success)' : 'var(--wif-danger)',
                color: 'white',
              }}
            >
              {game.is_successful ? 'Viable' : 'Flopped'}
            </span>
            {isNew && (
              <span className="px-2 py-0.5 text-[9px] font-bold font-label tracking-widest uppercase bg-primary text-primary-foreground">
                New Entry
              </span>
            )}
            {game.is_early_access && (
              <span className="px-2 py-0.5 text-[9px] font-bold font-label tracking-widest uppercase border border-white/40 text-white/80">
                Early Access
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="font-headline font-black tracking-tighter text-white leading-none mb-4"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
          >
            {game.name}
          </h1>

          {/* Genre chips */}
          {genres.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {genres.map(g => (
                <span
                  key={g}
                  className="px-2 py-0.5 text-[9px] font-label tracking-widest uppercase border border-white/25 text-white/70"
                >
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────── */}
      <div className="max-w-screen-2xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* ── Left — main content ──────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-10">

          {/* Description */}
          {game.short_description_clean && (
            <section style={{ borderLeft: '3px solid var(--primary)' }} className="pl-5">
              <SectionLabel>About this game</SectionLabel>
              <p className="font-inter text-sm text-foreground/80 leading-relaxed">
                {game.short_description_clean}
              </p>
            </section>
          )}

          {/* Trailer */}
          <GameTrailer hlsUrl={game.trailer_hls_url} posterUrl={game.header_image} />

          {/* Community tags */}
          {tags.length > 0 && (
            <section>
              <SectionLabel>Community Tags</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {tags.map(t => (
                  <span
                    key={t.tag_name}
                    className="px-2.5 py-1 text-[10px] font-label tracking-wider uppercase bg-card border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    {t.tag_name}
                    <span className="ml-1.5 text-muted-foreground/40">{t.votes.toLocaleString()}</span>
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Screenshots gallery */}
          <ScreenshotGallery urls={game.screenshot_urls} />

          {/* Supported languages */}
          {game.supported_languages?.length > 0 && (
            <section>
              <SectionLabel>Supported Languages</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {game.supported_languages.map(lang => (
                  <span
                    key={lang}
                    className="px-2 py-0.5 text-[10px] font-label tracking-wider bg-surface-container-high text-muted-foreground"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Categories */}
          {categories.length > 0 && (
            <section>
              <SectionLabel>Features</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {categories.map(c => (
                  <div
                    key={c}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border text-[10px] font-label tracking-wider uppercase text-foreground/70"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>check_circle</span>
                    {c}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ── Right — sidebar stats ─────────────────────────────────── */}
        <aside className="flex flex-col gap-6">

          {/* Cover image */}
          {game.header_image && (
            <div className="overflow-hidden border border-border">
              <img
                src={game.header_image}
                alt={game.name}
                className="w-full object-cover"
                style={{ aspectRatio: '16/9' }}
              />
            </div>
          )}

          {/* Price + status */}
          <div className="bg-card border border-border p-4 flex items-center justify-between">
            <div>
              <div className="font-label text-[9px] tracking-widest uppercase text-muted-foreground mb-0.5">Price</div>
              <div className="font-headline font-black text-xl text-foreground">
                {formatPrice(game.is_free, game.price_eur)}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              {game.has_dlc && (
                <span className="px-2 py-0.5 text-[9px] font-label tracking-widest uppercase bg-surface-container text-muted-foreground border border-border">
                  Has DLC
                </span>
              )}
              {game.is_free && (
                <span className="px-2 py-0.5 text-[9px] font-label tracking-widest uppercase bg-surface-container text-muted-foreground border border-border">
                  Free
                </span>
              )}
            </div>
          </div>

          {/* Reception */}
          <div className="bg-card border border-border p-4 flex flex-col gap-4">
            <SectionLabel>Critical Reception</SectionLabel>

            <MetacriticBlock score={game.metacritic_score} />

            <ReviewBar
              positive={game.review_total_positive}
              total={game.review_total}
            />

            <div className="font-label text-[9px] tracking-widest uppercase text-muted-foreground text-right">
              {game.review_total?.toLocaleString()} total reviews
            </div>
          </div>

          {/* Audience metrics */}
          <div className="bg-card border border-border p-4">
            <SectionLabel>Audience Metrics</SectionLabel>
            <div className="flex flex-col">
              <StatRow
                icon="group"
                label="Est. Owners"
                value={formatOwners(game.owners_midpoint)}
                accent
              />
              <StatRow
                icon="leaderboard"
                label="Peak CCU"
                value={game.spy_peak_ccu?.toLocaleString() ?? '—'}
              />
              <StatRow
                icon="schedule"
                label="Median Playtime"
                value={formatMinutes(game.spy_median_playtime)}
              />
              <StatRow
                icon="emoji_events"
                label="Achievements"
                value={game.achievement_count > 0 ? game.achievement_count : '—'}
              />
              {game.achievement_count > 0 && (
                <StatRow
                  icon="military_tech"
                  label="Avg. Unlock Rate"
                  value={`${game.achievement_median_unlock_rate?.toFixed(1)}%`}
                />
              )}
            </div>
          </div>

          {/* Twitch */}
          {game.is_on_twitch && (
            <div className="bg-card border border-border p-4">
              <SectionLabel>Live on Twitch</SectionLabel>
              <div className="flex flex-col">
                <StatRow
                  icon="live_tv"
                  label="Active Streams"
                  value={game.twitch_streams_count ?? 0}
                  accent
                />
                <StatRow
                  icon="visibility"
                  label="Viewers"
                  value={game.twitch_viewers_count?.toLocaleString() ?? '0'}
                />
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-card border border-border p-4">
            <SectionLabel>Release Info</SectionLabel>
            <div className="flex flex-col">
              <StatRow icon="calendar_month" label="Release Date" value={formatDate(game.release_date)} />
              <StatRow icon="tag" label="Steam ID" value={`#${game.app_id}`} />
            </div>
          </div>

        </aside>
      </div>
    </div>
  )
}
