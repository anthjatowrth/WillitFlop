/**
 * GameDetailPanel — floating hover card styled like the result card.
 * Layout: image portrait (left) + infos (right), infos en bas.
 */
export default function GameDetailPanel({ game, side, visible, variant = 'success' }) {
  // Fallback sur variant si verdict absent de la DB
  const isSuccess   = game.verdict === 'Top!' || (game.verdict == null && variant === 'success')
  const verdictText = game.verdict ?? (isSuccess ? 'Top!' : 'Flop!')
  const accentColor = isSuccess ? 'var(--primary)' : 'var(--tertiary)'
  const probaValue  = game.proba != null ? Math.round(game.proba * 100) : null

  const translateFrom = side === 'right' ? 'translateX(-8px)' : 'translateX(8px)'
  const positionStyle = side === 'right'
    ? { left: 'calc(100% + 16px)', top: '50%', transform: `translateY(-50%) ${visible ? 'translateX(0)' : translateFrom}` }
    : { right: 'calc(100% + 16px)', top: '50%', transform: `translateY(-50%) ${visible ? 'translateX(0)' : translateFrom}` }

  return (
    <div
      className="absolute z-50 pointer-events-none transition-all duration-200 ease-out"
      style={{
        ...positionStyle,
        width:       '420px',
        opacity:     visible ? 1 : 0,
        background:  'var(--card)',
        border:      `2px solid ${accentColor}`,
        boxShadow:   `0 16px 60px rgba(0,0,0,0.40), 0 0 0 1px rgba(0,0,0,0.06)`,
        overflow:    'hidden',
      }}
    >
      {/* ── Top: image portrait (gauche) + infos (droite) ── */}
      <div className="flex" style={{ minHeight: '220px' }}>

        {/* Cover — portrait, entièrement visible (contain) */}
        <div
          className="shrink-0 flex items-center justify-center"
          style={{
            width: '150px',
            background: 'linear-gradient(160deg, #0d1b2a 0%, #1a0a2e 60%, #0d1b2a 100%)',
            borderRight: `1px solid ${accentColor}40`,
          }}
        >
          {game.image ? (
            <img
              src={game.image}
              alt={game.title}
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            />
          ) : (
            <span
              className="material-symbols-outlined opacity-20"
              style={{ fontSize: '48px', color: 'var(--foreground)' }}
            >
              videogame_asset
            </span>
          )}
        </div>

        {/* Infos droite */}
        <div className="flex flex-col justify-between flex-1 p-4 gap-3 min-w-0">

          {/* Verdict + titre + creator */}
          <div>
            <span
              className="font-headline font-black leading-none block"
              style={{ fontSize: '1.8rem', color: accentColor }}
            >
              {verdictText}
            </span>
            <p className="font-headline text-sm font-bold text-foreground leading-tight mt-1 line-clamp-2">
              {game.title}
            </p>
            {game.creator && (
              <p
                className="font-label text-[9px] tracking-widest uppercase font-bold mt-0.5"
                style={{ color: accentColor }}
              >
                by {game.creator}
              </p>
            )}
          </div>

          {/* Succès prédit + Metacritic */}
          <div className="flex gap-4">
            {probaValue != null && (
              <div>
                <span className="font-label text-[8px] tracking-widest uppercase text-muted-foreground block mb-0.5">
                  Succès prédit
                </span>
                <span
                  className="font-headline text-xl font-black leading-none"
                  style={{ color: accentColor }}
                >
                  {probaValue}%
                </span>
                <div className="mt-1 h-0.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full" style={{ width: `${probaValue}%`, background: accentColor }} />
                </div>
              </div>
            )}
            {game.metacritic != null && (
              <div>
                <span className="font-label text-[8px] tracking-widest uppercase text-muted-foreground block mb-0.5">
                  Metacritic
                </span>
                <span
                  className="font-headline text-xl font-black leading-none"
                  style={{ color: 'var(--color-gold, #D4A017)' }}
                >
                  {game.metacritic}
                </span>
                <div className="mt-1 h-0.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full" style={{ width: `${game.metacritic}%`, background: 'var(--color-gold, #D4A017)' }} />
                </div>
              </div>
            )}
          </div>

          {/* Pricing */}
          {game.pricing && (
            <div
              className="self-start px-3 py-1"
              style={{ background: accentColor, boxShadow: '2px 3px 0 rgba(0,0,0,0.25)' }}
            >
              <span className="font-label text-[8px] tracking-widest uppercase block" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Prix
              </span>
              <span className="font-headline text-sm font-black text-white leading-tight">
                {game.pricing}
              </span>
            </div>
          )}

        </div>
      </div>

      {/* ── Bas: genre, univers, tags ── */}
      {(game.genre || game.universe || (game.tags && game.tags.length > 0)) && (
        <div
          className="px-4 py-3 flex flex-col gap-2"
          style={{ borderTop: `1px solid ${accentColor}30`, background: `${accentColor}08` }}
        >
          {(game.genre || game.universe) && (
            <div className="flex flex-wrap gap-x-5 gap-y-0.5">
              {game.genre && (
                <span className="font-inter text-xs text-muted-foreground">
                  <span className="font-label text-[8px] tracking-widest uppercase mr-1.5" style={{ color: accentColor }}>
                    Genre
                  </span>
                  {game.genre}
                </span>
              )}
              {game.universe && (
                <span className="font-inter text-xs text-muted-foreground">
                  <span className="font-label text-[8px] tracking-widest uppercase mr-1.5" style={{ color: accentColor }}>
                    Univers
                  </span>
                  {game.universe}
                </span>
              )}
            </div>
          )}
          {game.tags && game.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {game.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-label text-[8px] tracking-widest uppercase px-1.5 py-0.5"
                  style={{
                    color:      accentColor,
                    background: isSuccess ? 'rgba(232,0,90,0.08)' : 'rgba(0,122,140,0.10)',
                    border:     `1px solid ${isSuccess ? 'rgba(232,0,90,0.20)' : 'rgba(0,122,140,0.25)'}`,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  )
}
