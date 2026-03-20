import { useNavigate } from 'react-router-dom'
import { getScoreAccent } from '../../utils/scoreColor'

/** Format a "YYYY-MM-DD" string → "MAY 2024" */
function formatDate(dateStr) {
  if (!dateStr) return 'TBA'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()
}

/** Score badge shared between both variants */
function ScoreBadge({ score, className = '' }) {
  const accent = getScoreAccent(score)
  if (!accent) return null
  return (
    <div
      className={`border bg-black/40 backdrop-blur-sm px-2 py-1 ${className}`}
      style={{ borderColor: `var(--${accent})` }}
    >
      <div
        className="text-[8px] font-label tracking-widest uppercase leading-none"
        style={{ color: `var(--${accent})` }}
      >
        MC
      </div>
      <div
        className="text-sm font-bold font-headline leading-none"
        style={{ color: `var(--${accent})` }}
      >
        {score}
      </div>
    </div>
  )
}

/** Arrow button shared between both variants */
function ArrowButton() {
  return (
    <button className="w-7 h-7 flex items-center justify-center border border-border hover:border-primary hover:text-primary transition-all duration-300 text-muted-foreground shrink-0">
      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
    </button>
  )
}

/** Derives a single play-mode tag from Steam category names */
function getPlayMode(categories) {
  const cats = categories.map(c => c.toLowerCase())
  if (cats.some(c => c.includes('co-op') || c.includes('coop'))) return 'CO-OP'
  if (cats.some(c => c.includes('multi') || c.includes('pvp'))) return 'MULTI'
  if (cats.some(c => c.includes('single'))) return 'SOLO'
  return null
}

/** TOP / FLOP badge */
function TopFlopBadge({ isSuccessful }) {
  if (isSuccessful === null || isSuccessful === undefined) return null
  const color = isSuccessful ? 'var(--wif-success)' : 'var(--wif-danger)'
  const label = isSuccessful ? 'TOP' : 'FLOP'
  return (
    <span
      className="text-sm font-label font-bold tracking-widest uppercase px-3 py-1"
      style={{ background: color, color: 'white' }}
    >
      {label}
    </span>
  )
}

/** Cover image or placeholder */
function CoverImage({ url, title, className = '', objectFit = 'cover' }) {
  if (url) {
    return (
      <img
        src={url}
        alt={title}
        className={`w-full h-full ${className}`}
        style={{ objectFit }}
      />
    )
  }
  return (
    <div className={`w-full h-full bg-surface-container-high flex items-center justify-center ${className}`}>
      <span className="material-symbols-outlined text-3xl text-muted-foreground">videogame_asset</span>
    </div>
  )
}

/**
 * GameCard — renders a single game entry in either grid or list layout.
 *
 * Props:
 *   variant        "grid" (default) | "list"
 *   title          string
 *   genres         string[]
 *   releaseDate    string   — raw "YYYY-MM-DD", formatted internally
 *   metacriticScore number | null
 *   coverImageUrl  string | null
 *   gameId         number | string
 *   isNew          boolean
 */
export default function GameCard({
  variant = 'grid',
  title,
  genres = [],
  categories = [],
  releaseDate,
  metacriticScore,
  coverImageUrl,
  gameId,
  isNew = false,
  isSuccessful,
}) {
  const navigate = useNavigate()
  const formattedDate = formatDate(releaseDate)
  const handleClick = () => navigate(`/database/${gameId}`)

  if (variant === 'list') {
    return (
      <div
        onClick={handleClick}
        className="flex items-center gap-4 px-4 py-3 bg-card border border-border hover:bg-surface-container-low transition-all duration-300 cursor-pointer"
      >
        {/* Thumbnail */}
        <div className="shrink-0 overflow-hidden" style={{ width: '96px', aspectRatio: '16/9' }}>
          <CoverImage url={coverImageUrl} title={title} objectFit="contain" />
        </div>

        {/* Title + tags */}
        <div className="flex-1 min-w-0">
          <div className="font-headline font-bold text-sm text-foreground truncate">{title}</div>
          <div className="flex gap-1 mt-0.5 flex-wrap">
            {getPlayMode(categories) && (
              <span
                className="px-1.5 py-0.5 text-[8px] font-label tracking-wider uppercase border"
                style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
              >
                {getPlayMode(categories)}
              </span>
            )}
            {genres.slice(0, 2).map(g => (
              <span
                key={g}
                className="px-1.5 py-0.5 text-[8px] font-label tracking-wider uppercase bg-surface-container-high text-muted-foreground"
              >
                {g}
              </span>
            ))}
          </div>
        </div>

        {/* Date + score + top/flop */}
        <div className="hidden md:flex items-center gap-3">
          <span className="text-[10px] font-label text-muted-foreground uppercase tracking-wider whitespace-nowrap">
            {formattedDate}
          </span>
          {(isSuccessful === true || isSuccessful === false) && (
            <span
              className="text-[9px] font-label font-bold tracking-widest uppercase px-1.5 py-0.5 whitespace-nowrap"
              style={{
                background: isSuccessful ? 'var(--wif-success)' : 'var(--wif-danger)',
                color: 'white',
              }}
            >
              {isSuccessful ? 'TOP' : 'FLOP'}
            </span>
          )}
          {getScoreAccent(metacriticScore) && (
            <div
              className="border px-2 py-1"
              style={{ borderColor: `var(--${getScoreAccent(metacriticScore)})` }}
            >
              <span
                className="text-xs font-bold font-label"
                style={{ color: `var(--${getScoreAccent(metacriticScore)})` }}
              >
                {metacriticScore}
              </span>
            </div>
          )}
        </div>

        <ArrowButton />
      </div>
    )
  }

  // ── Grid variant ─────────────────────────────────────────────────────────
  return (
    <div
      onClick={handleClick}
      className="group flex flex-col bg-card border border-border hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
    >

      {/* Image area */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <CoverImage
          url={coverImageUrl}
          title={title}
          className="group-hover:scale-105 transition-transform duration-500"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* "New Entry" badge */}
        {isNew && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-primary text-primary-foreground text-[9px] font-bold tracking-widest uppercase font-label">
            New Entry
          </div>
        )}

        {/* Metacritic score badge */}
        <ScoreBadge score={metacriticScore} className="absolute bottom-2 left-2" />
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="flex-1">
          <h3 className="font-headline font-bold text-sm leading-tight text-foreground line-clamp-2">
            {title}
          </h3>

          {(genres.length > 0 || getPlayMode(categories)) && (
            <div className="flex flex-wrap gap-1 mt-2">
              {getPlayMode(categories) && (
                <span
                  className="px-1.5 py-0.5 text-[9px] font-label tracking-wider uppercase border"
                  style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
                >
                  {getPlayMode(categories)}
                </span>
              )}
              {genres.slice(0, 3).map(g => (
                <span
                  key={g}
                  className="px-1.5 py-0.5 text-[9px] font-label tracking-wider uppercase bg-surface-container-high text-muted-foreground"
                >
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] font-label text-muted-foreground uppercase tracking-wider">
            {formattedDate}
          </span>
          <TopFlopBadge isSuccessful={isSuccessful} />
          <ArrowButton />
        </div>
      </div>
    </div>
  )
}
