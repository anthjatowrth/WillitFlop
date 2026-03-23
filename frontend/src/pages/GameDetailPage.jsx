import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Hls from 'hls.js'
import { supabase } from '../api/client'
import { getScoreAccent } from '../utils/scoreColor'
import { translateToFR } from '../utils/deepl'

// ── Formatting helpers ────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return 'À venir'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
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
  if (isF) return 'Gratuit'
  if (!priceEur) return '—'
  return `€${priceEur.toFixed(2)}`
}

// ── Sub-components ────────────────────────────────────────────────────────

/** Section header with left primary border */
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

/** Metacritic score display — large format, half-card */
function MetacriticBlock({ score }) {
  const accent = getScoreAccent(score)
  if (!accent) return (
    <div className="flex flex-col items-center justify-center py-4 border border-border flex-1">
      <span className="font-label text-[9px] tracking-widest uppercase text-muted-foreground">Metacritic</span>
      <span className="font-headline text-4xl font-black text-muted-foreground/30 mt-1">N/A</span>
    </div>
  )
  return (
    <div
      className="flex flex-col items-center justify-center py-4 border flex-1"
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

/** Community score display — large format, half-card */
function CommunityScoreBlock({ positive, total }) {
  if (!total) return (
    <div className="flex flex-col items-center justify-center py-4 border border-border flex-1">
      <span className="font-label text-[9px] tracking-widest uppercase text-muted-foreground">Score Communauté</span>
      <span className="font-headline text-4xl font-black text-muted-foreground/30 mt-1">N/A</span>
    </div>
  )
  const pct = Math.round((positive / total) * 100)
  const color = pct >= 70 ? 'var(--wif-success)' : pct >= 50 ? 'var(--wif-warn)' : 'var(--wif-danger)'
  return (
    <div className="flex flex-col items-center justify-center py-4 border flex-1" style={{ borderColor: color }}>
      <span className="font-label text-[9px] tracking-widest uppercase" style={{ color }}>
        Score Communauté
      </span>
      <span className="font-headline text-4xl font-black mt-1 leading-none" style={{ color }}>
        {pct}%
      </span>
      <div className="w-full px-3 mt-2">
        <div className="h-1.5 bg-surface-container-high overflow-hidden">
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="font-label text-[8px] text-muted-foreground/60">↑ {positive.toLocaleString()}</span>
          <span className="font-label text-[8px] text-muted-foreground/60">↓ {(total - positive).toLocaleString()}</span>
        </div>
      </div>
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

    const isHls = hlsUrl.includes('.m3u8')

    if (isHls && Hls.isSupported()) {
      const hls = new Hls()
      hls.loadSource(hlsUrl)
      hls.attachMedia(video)
      return () => hls.destroy()
    } else if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl
    } else {
      video.src = hlsUrl
    }
  }, [hlsUrl])

  if (!hlsUrl) return null

  return (
    <section>
      <SectionLabel>Trailer</SectionLabel>
      <div className="overflow-hidden border border-border group" style={{ aspectRatio: '16/9' }}>
        <video
          ref={videoRef}
          poster={posterUrl}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          onMouseEnter={(e) => e.currentTarget.setAttribute('controls', '')}
          onMouseLeave={(e) => e.currentTarget.removeAttribute('controls')}
        />
      </div>
    </section>
  )
}

/** Lightbox overlay — fullscreen image viewer */
function Lightbox({ url, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        onClick={onClose}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>close</span>
      </button>
      <img
        src={url}
        alt="Screenshot"
        className="max-w-[90vw] max-h-[90vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

/** Screenshots gallery — thumbnails in a row, click to enlarge */
function ScreenshotGallery({ urls }) {
  const [active, setActive] = useState(urls?.[0] ?? null)
  const [lightbox, setLightbox] = useState(null)
  if (!urls?.length) return null

  return (
    <>
      {lightbox && <Lightbox url={lightbox} onClose={() => setLightbox(null)} />}
      <section>
        <SectionLabel>Captures d'écran</SectionLabel>
        <div className="flex flex-col gap-3">
          <div
            className="overflow-hidden border border-border cursor-zoom-in relative group"
            style={{ aspectRatio: '16/9' }}
            onClick={() => setLightbox(active)}
          >
            <img
              src={active}
              alt="Screenshot"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
              <span className="material-symbols-outlined text-white" style={{ fontSize: '32px' }}>zoom_in</span>
            </div>
          </div>
          <div className="flex gap-2">
            {urls.map((url, i) => (
              <button
                key={url}
                className="overflow-hidden border transition-all duration-200 flex-1"
                style={{
                  aspectRatio: '16/9',
                  borderColor: active === url ? 'var(--primary)' : 'var(--border)',
                }}
                onClick={() => setActive(url)}
              >
                <img
                  src={url}
                  alt={`Screenshot ${i + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

/** Screenshot carousel — auto-slide, used when no trailer is available */
function ScreenshotCarousel({ urls }) {
  const [index, setIndex] = useState(0)
  const [lightbox, setLightbox] = useState(null)
  if (!urls?.length) return null

  const prev = () => setIndex((i) => (i - 1 + urls.length) % urls.length)
  const next = () => setIndex((i) => (i + 1) % urls.length)

  return (
    <>
      {lightbox && <Lightbox url={lightbox} onClose={() => setLightbox(null)} />}
      <section>
        <SectionLabel>Captures d'écran</SectionLabel>
        <div className="flex flex-col gap-3">
          <div
            className="relative overflow-hidden border border-border group cursor-zoom-in"
            style={{ aspectRatio: '16/9' }}
            onClick={() => setLightbox(urls[index])}
          >
            <img
              src={urls[index]}
              alt={`Screenshot ${index + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
              <span className="material-symbols-outlined text-white" style={{ fontSize: '32px' }}>zoom_in</span>
            </div>
            <button
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white transition-colors p-1"
              onClick={(e) => { e.stopPropagation(); prev() }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_left</span>
            </button>
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white transition-colors p-1"
              onClick={(e) => { e.stopPropagation(); next() }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_right</span>
            </button>
            <div className="absolute bottom-2 right-3 bg-black/60 px-2 py-0.5 font-label text-[10px] tracking-wider text-white/80">
              {index + 1} / {urls.length}
            </div>
          </div>
          <div className="flex gap-1.5 justify-center">
            {urls.map((_, i) => (
              <button
                key={i}
                className="w-1.5 h-1.5 transition-all duration-200"
                style={{ background: i === index ? 'var(--primary)' : 'var(--border)' }}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function GameDetailPage() {
  const { appId } = useParams()
  const navigate   = useNavigate()

  const [game, setGame]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [translated, setTranslated] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setTranslated(null)

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
        if (err) { setError(err); setLoading(false); return }
        setGame(data)
        setLoading(false)

        const description = data.short_description_clean ?? ''
        const genres      = (data.game_genres ?? []).map(r => r.genre_name)
        const tags        = [...(data.game_tags ?? [])].sort((a, b) => b.votes - a.votes).slice(0, 12).map(r => r.tag_name)
        const categories  = (data.game_categories ?? []).map(r => r.category_name)

        const batch = [description, ...genres, ...tags, ...categories].filter(Boolean)
        if (!batch.length) return

        translateToFR(batch).then(results => {
          let i = 0
          const tr = {}
          tr.description = description ? results[i++] : ''
          tr.genres      = genres.map(() => results[i++])
          tr.tags        = tags.map(() => results[i++])
          tr.categories  = categories.map(() => results[i++])
          setTranslated(tr)
        })
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
          <p className="font-headline font-bold mt-3 text-foreground">Jeu introuvable</p>
          <p className="font-inter text-sm text-muted-foreground mt-1 mb-6">
            {error?.message ?? 'Aucune entrée avec cet identifiant dans la base de données.'}
          </p>
          <button
            onClick={() => navigate('/database')}
            className="px-5 py-2 bg-primary text-primary-foreground font-bold text-xs font-label tracking-widest uppercase"
          >
            Retour au catalogue
          </button>
        </div>
      </div>
    )
  }

  // ── Derived values ───────────────────────────────────────────────────
  const screenshotUrls = (() => {
    const raw = game.screenshot_urls
    if (!raw) return []
    if (Array.isArray(raw)) return raw
    try { return JSON.parse(raw) } catch { return [] }
  })()

  const genresRaw     = game.game_genres?.map(r => r.genre_name) ?? []
  const tagsRaw       = [...(game.game_tags ?? [])].sort((a, b) => b.votes - a.votes).slice(0, 12)
  const categoriesRaw = game.game_categories?.map(r => r.category_name) ?? []

  const description = translated?.description ?? game.short_description_clean
  const genres      = translated
    ? genresRaw.map((_, i) => translated.genres[i] ?? genresRaw[i])
    : genresRaw
  const tags = translated
    ? tagsRaw.map((t, i) => ({ ...t, tag_name: translated.tags[i] ?? t.tag_name }))
    : tagsRaw
  const categories = translated
    ? categoriesRaw.map((_, i) => translated.categories[i] ?? categoriesRaw[i])
    : categoriesRaw

  const isNew = (() => {
    if (!game.fetched_at) return false
    const ago = new Date(); ago.setDate(ago.getDate() - 30)
    return new Date(game.fetched_at) > ago
  })()

  const successColor = game.is_successful ? 'var(--wif-success)' : 'var(--wif-danger)'

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="linear-grid min-h-full">

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden" style={{ minHeight: '320px' }}>

        {game.header_image
          ? <img
              src={game.header_image}
              alt={game.name}
              className="absolute inset-0 w-full h-full object-cover scale-105 blur-sm"
            />
          : <div className="absolute inset-0 bg-surface-container-high" />
        }

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30" />
        <div className="absolute inset-0 linear-grid opacity-30" />

        <div className="relative max-w-screen-2xl mx-auto px-6 py-10 flex flex-col justify-end h-full" style={{ minHeight: '320px' }}>

          <button
            onClick={() => navigate('/database')}
            className="flex items-center gap-1.5 font-label text-[10px] tracking-widest uppercase text-white/60 hover:text-white transition-colors mb-6 self-start"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_back</span>
            Catalogue de jeux
          </button>

          <div className="flex items-center gap-2 mb-3">
            {isNew && (
              <span className="px-2 py-0.5 text-[9px] font-bold font-label tracking-widest uppercase bg-primary text-primary-foreground">
                Nouveau
              </span>
            )}
            {game.is_early_access && (
              <span className="px-2 py-0.5 text-[9px] font-bold font-label tracking-widest uppercase border border-white/40 text-white/80">
                Accès Anticipé
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <h1 className="font-headline font-black tracking-tighter text-white leading-none"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
            >
              {game.name}
            </h1>
            {/* Verdict token — inline avec le titre */}
            <div
              className="flex items-center gap-2 px-4 py-2.5 border"
              style={{
                borderColor: successColor,
                background: game.is_successful
                  ? 'color-mix(in srgb, var(--wif-success) 15%, transparent)'
                  : 'color-mix(in srgb, var(--wif-danger) 15%, transparent)',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '22px', color: successColor }}
              >
                {game.is_successful ? 'trending_up' : 'trending_down'}
              </span>
              <span
                className="font-headline font-bold text-lg tracking-wide"
                style={{ color: successColor }}
              >
                {game.is_successful ? 'Succès' : 'Flop'}
              </span>
            </div>
          </div>

          {genres.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {genres.map((g, i) => (
                <span
                  key={genresRaw[i]}
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
          {description && (
            <section style={{ borderLeft: '3px solid var(--primary)' }} className="pl-5">
              <SectionLabel>À propos de ce jeu</SectionLabel>
              <p className="font-inter text-base text-foreground/80 leading-relaxed">
                {description}
              </p>
            </section>
          )}

          {/* Trailer or Screenshot carousel */}
          {game.trailer_hls_url
            ? <GameTrailer hlsUrl={game.trailer_hls_url} posterUrl={game.header_image} />
            : <ScreenshotCarousel urls={screenshotUrls} />
          }

          {/* Facteurs de succès */}
          {(tagsRaw.length > 0 || categories.length > 0) && (
            <section>
              <SectionLabel>Facteurs de succès identifiés</SectionLabel>
              <div className="flex flex-col gap-4">
                {tagsRaw.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {tagsRaw.slice(0, 6).map((t, i) => (
                      <div
                        key={t.tag_name}
                        className="bg-card border p-3"
                        style={{ borderColor: i < 3 ? 'var(--primary)' : 'var(--border)' }}
                      >
                        <div className="font-label text-[8px] tracking-widest uppercase text-muted-foreground mb-1">
                          {i < 3 ? 'Signal fort' : 'Signal'}
                        </div>
                        <div className="font-headline font-bold text-sm text-foreground mb-2">
                          {tags[i]?.tag_name ?? t.tag_name}
                        </div>
                        <div className="h-1 bg-surface-container-high overflow-hidden">
                          <div
                            className="h-full transition-all duration-700"
                            style={{
                              width: `${Math.min(100, Math.round((t.votes / (tagsRaw[0]?.votes || 1)) * 100))}%`,
                              background: i < 3 ? 'var(--primary)' : 'var(--border)',
                            }}
                          />
                        </div>
                        <div className="font-label text-[8px] text-muted-foreground/60 mt-1">
                          {t.votes.toLocaleString()} votes
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {categories.map((c, i) => (
                      <div
                        key={categoriesRaw[i] ?? i}
                        className="flex items-center gap-1.5 px-3 py-1.5 border text-[10px] font-label tracking-wider uppercase"
                        style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>check_circle</span>
                        {c}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Screenshots gallery — only when trailer is present */}
          {game.trailer_hls_url && <ScreenshotGallery urls={screenshotUrls} />}

          {/* Community tags */}
          {tags.length > 0 && (
            <section>
              <SectionLabel>Tags Communauté</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {tags.map((t, i) => (
                  <span
                    key={tagsRaw[i]?.tag_name ?? i}
                    className="px-2.5 py-1 text-[10px] font-label tracking-wider uppercase bg-card border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    {t.tag_name}
                    <span className="ml-1.5 text-muted-foreground/40">{t.votes.toLocaleString()}</span>
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Fonctionnalités */}
          {categories.length > 0 && (
            <section>
              <SectionLabel>Fonctionnalités</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {categories.map((c, i) => (
                  <div
                    key={categoriesRaw[i] ?? i}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border text-[10px] font-label tracking-wider uppercase text-foreground/70"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>check_circle</span>
                    {c}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Langues supportées — dernier élément */}
          {game.supported_languages?.length > 0 && (
            <section>
              <SectionLabel>Langues supportées</SectionLabel>
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

          {/* Scores — Metacritic + Community côte à côte */}
          <div className="bg-card border border-border p-4 flex flex-col gap-4">
            <SectionLabel>Réception critique</SectionLabel>
            <div className="flex gap-3">
              <MetacriticBlock score={game.metacritic_score} />
              <CommunityScoreBlock
                positive={game.review_total_positive}
                total={game.review_total}
              />
            </div>
            {game.review_total > 0 && (
              <div className="font-label text-[9px] tracking-widest uppercase text-muted-foreground text-right">
                {game.review_total?.toLocaleString()} avis au total
              </div>
            )}
          </div>

          {/* Prix + Date de sortie */}
          <div className="bg-card border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-label text-[9px] tracking-widest uppercase text-muted-foreground mb-0.5">Prix</div>
                <div className="font-headline font-black text-xl text-foreground">
                  {formatPrice(game.is_free, game.price_eur)}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                {game.is_free && (
                  <span className="px-2 py-0.5 text-[9px] font-label tracking-widest uppercase bg-surface-container text-muted-foreground border border-border">
                    Gratuit
                  </span>
                )}
              </div>
            </div>
            <div className="border-t border-border/40 pt-1">
              <StatRow icon="calendar_month" label="Date de sortie" value={formatDate(game.release_date)} />
            </div>
          </div>

          {/* Métriques d'audience */}
          <div className="bg-card border border-border p-4">
            <SectionLabel>Métriques d'audience</SectionLabel>
            <div className="flex flex-col">
              <StatRow
                icon="group"
                label="Propriétaires est."
                value={formatOwners(game.owners_midpoint)}
                accent
              />
              <StatRow
                icon="leaderboard"
                label="Pic de joueurs"
                value={game.spy_peak_ccu?.toLocaleString() ?? '—'}
              />
              <StatRow
                icon="schedule"
                label="Temps de jeu médian"
                value={formatMinutes(game.spy_median_playtime)}
              />
              <StatRow
                icon="emoji_events"
                label="Succès Steam"
                value={game.achievement_count > 0 ? game.achievement_count : '—'}
              />
              {game.achievement_count > 0 && (
                <StatRow
                  icon="military_tech"
                  label="Taux débloqué moy."
                  value={`${game.achievement_median_unlock_rate?.toFixed(1)}%`}
                />
              )}
            </div>
          </div>

          {/* Twitch */}
          {game.is_on_twitch && (
            <div className="bg-card border border-border p-4">
              <div className="flex items-center gap-2 mb-4">
                {/* Twitch logo */}
                <svg viewBox="0 0 24 28" fill="#9146FF" style={{ width: '16px', height: '16px', flexShrink: 0 }}>
                  <path d="M2.149 0L0 4.5v19h6v3l3.5-3H14l6-6V0H2.149zM19 17l-3 3H10l-3.5 3.5V20H3V2h16v15z" />
                  <path d="M16 7h-2v5h2V7zm-5 0H9v5h2V7z" />
                </svg>
                <span className="font-label text-[10px] tracking-[0.35em] uppercase text-primary">
                  Live sur Twitch
                </span>
              </div>
              <div className="flex flex-col">
                <StatRow
                  icon="live_tv"
                  label="Streams actifs"
                  value={game.twitch_streams_count ?? 0}
                  accent
                />
                <StatRow
                  icon="visibility"
                  label="Spectateurs"
                  value={game.twitch_viewers_count?.toLocaleString() ?? '0'}
                />
              </div>
            </div>
          )}

        </aside>
      </div>
    </div>
  )
}
