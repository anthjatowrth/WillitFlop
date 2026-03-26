import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { translateToFR } from '../utils/deepl'
import SectionLabel from '../components/SectionLabel'
import StatRow from '../components/StatRow'
import MetacriticBlock from '../components/MetacriticBlock'
import CommunityScoreBlock from '../components/CommunityScoreBlock'
import Skeleton from '../components/Skeleton'
import GameTrailer from '../components/GameTrailer'
import ScreenshotGallery from '../components/ScreenshotGallery'
import ScreenshotCarousel from '../components/ScreenshotCarousel'

// URL de l'API FastAPI centralisée
const API_URL = import.meta.env.VITE_API_URL

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

    // Centralisé : remplace l'appel Supabase direct par FastAPI (api/routers/games.py)
    fetch(`${API_URL}/api/games/${appId}`)
      .then(async res => {
        const data = await res.json()
        if (!res.ok) { setError({ message: data.detail || `HTTP ${res.status}` }); setLoading(false); return }
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
      .catch(err => { setError({ message: err.message }); setLoading(false) })
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
            className="px-5 py-2 bg-primary text-primary-foreground font-bold text-xs font-label tracking-widest uppercase hover:bg-primary/90 active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
            className="flex items-center gap-1.5 font-label text-[10px] tracking-widest uppercase text-white/60 hover:text-white focus-visible:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/60 transition-colors mb-6 self-start"
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
                        <div className="font-label text-[10px] tracking-widest uppercase text-muted-foreground mb-1">
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
                        <div className="font-label text-[10px] text-muted-foreground/60 mt-1">
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
