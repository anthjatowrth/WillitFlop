import { useState, useEffect, useMemo } from 'react'
import { useGameDatabase } from '../hooks/useGameDatabase'

// URL de l'API FastAPI centralisée
const API_URL = import.meta.env.VITE_API_URL
import GameCard from '../components/database/GameCard'
import SkeletonGrid from '../components/database/SkeletonGrid'
import SkeletonList from '../components/database/SkeletonList'

const PAGE_SIZE = 80

// ── Helpers ───────────────────────────────────────────────────────────────

function isRecentlyAdded(fetchedAt) {
  if (!fetchedAt) return false
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  return new Date(fetchedAt) > thirtyDaysAgo
}

function relevanceScore(name, q) {
  if (!name) return 0
  const n = name.toLowerCase()
  if (n === q) return 4
  if (n.startsWith(q)) return 3
  if (n.split(/\s+/).some(w => w.startsWith(q))) return 2
  return 1
}

function extractYears(games) {
  const years = new Set()
  games.forEach(g => {
    if (g.release_date) {
      const y = g.release_date.slice(0, 4)
      if (y) years.add(y)
    }
  })
  return Array.from(years).sort((a, b) => b - a)
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function GameDatabasePage() {
  const [page, setPage]             = useState(1)
  const [year, setYear]             = useState('')
  const [search, setSearch]         = useState('')
  const [playMode, setPlayMode]     = useState('') // '' | 'solo' | 'multi' | 'coop'
  const [letterFilter, setLetter]   = useState('A') // '' | 'A'-'Z' | '#'
  const [sortBy, setSortBy]         = useState('alpha') // 'alpha' | 'owners' | 'metacritic'
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'

  // Total unfiltered count for the intro text
  // Centralisé : remplace le full scan Supabase par un appel FastAPI
  const [totalGamesCount, setTotalGamesCount] = useState(0)
  useEffect(() => {
    fetch(`${API_URL}/api/games/count`)
      .then(r => r.json())
      .then(({ count }) => { if (count) setTotalGamesCount(count) })
      .catch(() => {})
  }, [])

  // Accumulated games for "Load More" pattern
  const [allGames, setAllGames]       = useState([])
  const [isAppending, setIsAppending] = useState(false)

  const { games: pageGames, totalCount, loading, error, refetch } = useGameDatabase({
    page,
    pageSize: PAGE_SIZE,
    year,
    search,
    playMode,
    letterFilter,
    sortBy,
  })

  // Accumulate or replace when Supabase returns a page
  useEffect(() => {
    if (loading) return
    if (isAppending) {
      setAllGames(prev => [...prev, ...pageGames])
      setIsAppending(false)
    } else {
      setAllGames(pageGames)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageGames, loading])

  // Reset to page 1 when server-side filters change
  useEffect(() => {
    setPage(1)
    setAllGames([])
    setIsAppending(false)
  }, [year, search, playMode, letterFilter, sortBy])

  // Sort by relevance when a search is active (server already filtered by ilike)
  const filteredGames = useMemo(() => {
    if (!search.trim()) return allGames
    const q = search.trim().toLowerCase()
    return [...allGames].sort((a, b) => {
      const diff = relevanceScore(b.name, q) - relevanceScore(a.name, q)
      if (diff !== 0) return diff
      return (b.metacritic_score ?? 0) - (a.metacritic_score ?? 0)
    })
  }, [allGames, search])

  // Distinct years from accumulated data
  const availableYears = useMemo(() => extractYears(allGames), [allGames])

  const totalPages  = Math.ceil(totalCount / PAGE_SIZE)
  const hasMore     = page < totalPages
  const connectionOk = !error

  // ── Handlers ──────────────────────────────────────────────────────────

  function handlePageChange(newPage) {
    setIsAppending(false)
    setAllGames([])
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleLoadMore() {
    if (!hasMore || loading) return
    setIsAppending(true)
    setPage(p => p + 1)
  }

  function handleYearChange(e) {
    setYear(e.target.value)
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="technical-grid min-h-full">
      <div className="max-w-screen-2xl mx-auto px-6 py-12">

        {/* ── Section 1 — Editorial Header ─────────────────────────── */}
        <section
          className="mb-10 pl-5"
          style={{ borderLeft: '3px solid var(--primary)' }}
        >
          {/* Connection indicator */}
          <div className="flex items-center gap-2 mb-4">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: connectionOk ? 'var(--wif-success)' : 'var(--wif-danger)' }}
            />
            <span className="font-label text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
              {connectionOk
                ? 'Will it flop connection : Active'
                : 'Connection Error : Supabase Unreachable'}
            </span>
          </div>

          <h1 className="font-headline font-black tracking-tighter text-foreground leading-none"
            style={{ fontSize: 'clamp(2rem, 7vw, 4.5rem)' }}
          >
            NOTRE CATALOGUE
            <span style={{ color: 'var(--primary)' }}> INDIE GAMES</span>
          </h1>

          <p className="mt-3 font-inter text-sm text-muted-foreground max-w-2xl">
            Notre catalogue réunit {totalGamesCount > 0 ? totalGamesCount.toLocaleString() : 'plus de seize mille'} jeux
            publiés sur Steam. Nous avons
            fait le choix de nous concentrer sur la scène indé : des créations portées par des studios de
            petite taille, souvent fondés sur une vision forte et des prises de risque assumées, exactement
            le type de projets que nous aimons analyser. Nous rappelons que notre site n'a pas pour objectif de représenter tous les jeux de la scène indé{' '}
            <a
              href="/#data-filter"
              className="text-primary underline underline-offset-2 hover:opacity-75 transition-opacity"
            >
              (voir données)
            </a>. Utilisez les filtres pour explorer
            et trouvez le titre qui vous inspire.
          </p>
        </section>

        {/* ── Section 2 — Filter Bar ───────────────────────────────── */}
        <section className="mb-10">
          <div className="grid grid-cols-12 gap-3">

            {/* Search */}
            <div className="col-span-12 md:col-span-6 relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-muted-foreground"
                style={{ fontSize: '18px' }}
              >
                search
              </span>
              <input
                type="text"
                placeholder="Recherche par titre…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-card border border-border text-sm font-inter text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Year */}
            <div className="col-span-6 md:col-span-2">
              <select
                value={year}
                onChange={handleYearChange}
                className="w-full px-3 py-2.5 bg-card border border-border text-sm font-inter text-foreground focus:outline-none focus:border-primary transition-colors appearance-none"
              >
                <option value="">Année</option>
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Play mode */}
            <div className="col-span-6 md:col-span-2">
              <select
                value={playMode}
                onChange={e => setPlayMode(e.target.value)}
                className="w-full px-3 py-2.5 bg-card border border-border text-sm font-inter text-foreground focus:outline-none focus:border-primary transition-colors appearance-none"
              >
                <option value="">Tous les modes</option>
                <option value="solo">Solo</option>
                <option value="multi">Multi</option>
                <option value="coop">Co-op</option>
              </select>
            </div>

            {/* View toggle */}
            <div className="col-span-12 md:col-span-2 flex gap-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex-1 py-2.5 flex items-center justify-center border transition-all duration-300 ${
                  viewMode === 'grid'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:border-primary hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>grid_view</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 py-2.5 flex items-center justify-center border transition-all duration-300 ${
                  viewMode === 'list'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:border-primary hover:text-primary'
                }`}
                style={{ marginLeft: '-1px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>view_list</span>
              </button>
            </div>
          </div>

          {/* Sort + Alphabet picker */}
          <div className="mt-3 flex items-center gap-4 flex-wrap">

            {/* Sort buttons */}
            <div className="flex gap-0 shrink-0">
              {[
                { key: 'alpha',      label: 'A → Z' },
                { key: 'owners',     label: 'Popularité' },
                { key: 'metacritic', label: 'Metacritic' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => {
                    setSortBy(key)
                    if (key === 'alpha') {
                      setLetter('A')
                    } else {
                      setLetter('')
                    }
                  }}
                  className={`px-3 h-7 text-[10px] font-label tracking-wider uppercase border transition-all duration-200 ${
                    sortBy === key
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-muted-foreground border-border hover:border-primary hover:text-primary'
                  }`}
                  style={{ marginLeft: key === 'alpha' ? 0 : '-1px' }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Alphabet picker — only shown in alpha mode */}
            {sortBy === 'alpha' && (
              <div className="flex flex-wrap gap-0">
                {['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(l => (
                  <button
                    key={l}
                    onClick={() => setLetter(letterFilter === l ? '' : l)}
                    className={`w-8 h-7 text-[11px] font-label tracking-wider transition-all duration-200 ${
                      letterFilter === l
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-primary'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Results count */}
          {!loading && (
            <div className="mt-2 font-label text-[10px] tracking-widest uppercase text-muted-foreground">
              {filteredGames.length > 0
                ? `Affiche ${filteredGames.length} sur ${totalCount.toLocaleString()} jeux`
                : null}
            </div>
          )}
        </section>

        {/* ── Section 4 — Game Cards ───────────────────────────────── */}
        <section className="mb-10">

          {/* Error state */}
          {error && (
            <div
              className="p-6 border"
              style={{ borderColor: 'var(--destructive)', background: 'var(--card)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--wif-danger)' }} />
                <span className="font-label text-[10px] tracking-widest uppercase text-destructive">
                  Connection Error
                </span>
              </div>
              <p className="font-inter text-sm text-muted-foreground mb-4">
                Failed to reach API: {error.message}
              </p>
              <button
                onClick={refetch}
                className="px-4 py-2 bg-primary text-primary-foreground font-bold text-xs font-label tracking-widest uppercase hover:opacity-90 transition-opacity"
              >
                Retry Connection
              </button>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && !error && (
            viewMode === 'grid'
              ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  <SkeletonGrid />
                </div>
              )
              : (
                <div className="flex flex-col gap-2">
                  <SkeletonList />
                </div>
              )
          )}

          {/* Empty state */}
          {!loading && !error && filteredGames.length === 0 && (
            <div className="py-20 flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-muted-foreground">
                search_off
              </span>
              <p className="font-headline font-bold text-foreground">No entries match your query</p>
              <p className="font-inter text-sm text-muted-foreground">
                Try adjusting the genre, year, or search term.
              </p>
            </div>
          )}

          {/* Game cards */}
          {!loading && !error && filteredGames.length > 0 && (
            viewMode === 'grid'
              ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {filteredGames.map(game => (
                    <GameCard
                      key={game.app_id}
                      variant="grid"
                      title={game.name}
                      genres={game.game_genres?.map(r => r.genre_name) ?? []}
                      categories={game.game_categories?.map(r => r.category_name) ?? []}
                      releaseDate={game.release_date}
                      metacriticScore={game.metacritic_score}
                      coverImageUrl={game.header_image}
                      gameId={game.app_id}
                      isNew={isRecentlyAdded(game.fetched_at)}
                      isSuccessful={game.is_successful}
                    />
                  ))}
                </div>
              )
              : (
                <div className="flex flex-col gap-2">
                  {filteredGames.map(game => (
                    <GameCard
                      key={game.app_id}
                      variant="list"
                      title={game.name}
                      genres={game.game_genres?.map(r => r.genre_name) ?? []}
                      categories={game.game_categories?.map(r => r.category_name) ?? []}
                      releaseDate={game.release_date}
                      metacriticScore={game.metacritic_score}
                      coverImageUrl={game.header_image}
                      gameId={game.app_id}
                      isNew={isRecentlyAdded(game.fetched_at)}
                      isSuccessful={game.is_successful}
                    />
                  ))}
                </div>
              )
          )}
        </section>

        {/* ── Section 5 — Pagination ───────────────────────────────── */}
        {!error && totalPages > 1 && (
          <section className="flex flex-col items-center gap-6">

            {/* Page number buttons */}
            <div className="flex items-center gap-1 flex-wrap justify-center">
              {/* Previous */}
              <button
                onClick={() => page > 1 && handlePageChange(page - 1)}
                disabled={page === 1}
                className="w-9 h-9 flex items-center justify-center border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_left</span>
              </button>

              {/* Page buttons — show a window around current page */}
              {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                let p
                if (totalPages <= 7) {
                  p = i + 1
                } else if (page <= 4) {
                  p = i + 1
                } else if (page >= totalPages - 3) {
                  p = totalPages - 6 + i
                } else {
                  p = page - 3 + i
                }

                return (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`w-9 h-9 flex items-center justify-center border text-xs font-label tracking-wider transition-all duration-300 ${
                      p === page
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-muted-foreground border-border hover:border-primary hover:text-primary'
                    }`}
                  >
                    {p}
                  </button>
                )
              })}

              {/* Next */}
              <button
                onClick={() => page < totalPages && handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="w-9 h-9 flex items-center justify-center border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
              </button>
            </div>

            {/* Load More */}
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-8 py-3 border border-primary text-primary font-bold font-label text-xs tracking-widest uppercase hover:bg-primary hover:text-primary-foreground transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && isAppending
                  ? 'Loading…'
                  : 'Load More Data'}
              </button>
            )}

            {/* Total indicator */}
            <p className="font-label text-[10px] tracking-widest uppercase text-muted-foreground/60">
              Page {page} / {totalPages}  {totalCount.toLocaleString()} total entries
            </p>
          </section>
        )}

      </div>
    </div>
  )
}
