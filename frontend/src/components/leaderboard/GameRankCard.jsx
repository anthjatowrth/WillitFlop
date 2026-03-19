/**
 * GameRankCard — core reusable card for both success and flop leaderboards.
 * Rank 1 is visually dominant; ranks 2–5 are progressively slimmer.
 */
export default function GameRankCard({
  rank,
  title,
  subtitle,
  score,
  image,
  tags,
  variant = 'success',
}) {
  const isFirst   = rank === 1;
  const isSuccess = variant === 'success';

  /* ── Border-left color ─────────────────────────────────────────── */
  const borderStyle = (() => {
    if (isFirst) {
      return isSuccess
        ? { borderLeft: '6px solid var(--color-gold)' }
        : { borderLeft: '6px solid var(--tertiary)' };
    }
    if (rank === 2) {
      return isSuccess
        ? { borderLeft: '6px solid #cbd5e1' }           /* slate-300 */
        : { borderLeft: '6px solid rgba(0,122,140,0.60)' }; /* tertiary/60 */
    }
    if (rank === 3) {
      return isSuccess
        ? { borderLeft: '6px solid rgba(217,119,6,0.50)' } /* amber-600/50 */
        : { borderLeft: '6px solid rgba(0,122,140,0.40)' }; /* tertiary/40 */
    }
    return {}; /* ranks 4–5: no border */
  })();

  /* ── Rank number faded text color ──────────────────────────────── */
  const rankColor = rank <= 3 ? '#94a3b8' : '#cbd5e1'; /* slate-400 / slate-300 */

  /* ── Decorative bg icon (rank 1 only) ──────────────────────────── */
  const bgIcon = isSuccess ? 'military_tech' : 'thumb_down';

  /* ── Halo shadow classes (rank 1 only) ─────────────────────────── */
  const haloBase  = isSuccess
    ? 'shadow-[0_0_40px_rgba(185,0,63,0.12)]'
    : 'shadow-[0_0_40px_rgba(0,102,114,0.12)]';
  const haloHover = isSuccess
    ? 'hover:shadow-[0_0_60px_rgba(185,0,63,0.22)]'
    : 'hover:shadow-[0_0_60px_rgba(0,102,114,0.22)]';

  if (isFirst) {
    return (
      <div
        className={`relative group overflow-hidden bg-card scale-[1.02] p-8 transition-all duration-300 ${haloBase} ${haloHover}`}
        style={borderStyle}
      >
        {/* Decorative background icon */}
        <span
          className="material-symbols-outlined absolute right-4 bottom-2 select-none pointer-events-none opacity-[0.06] group-hover:opacity-[0.10] transition-all duration-300 group-hover:scale-110"
          style={{ fontSize: '120px', color: 'var(--foreground)' }}
        >
          {bgIcon}
        </span>

        {/* Header row */}
        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* Rank badge */}
            <span
              className="font-headline text-xs font-black uppercase tracking-widest px-2 py-1 shrink-0"
              style={{
                color: isSuccess ? 'var(--color-gold)' : 'var(--tertiary)',
                border: `1px solid ${isSuccess ? 'var(--color-gold)' : 'var(--tertiary)'}`,
              }}
            >
              #{rank}
            </span>

            {/* Title + subtitle */}
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                {image && (
                  <img
                    src={image}
                    alt={title}
                    className="w-16 h-16 object-cover shrink-0 rounded-sm"
                  />
                )}
                {!image && (
                  <div
                    className="w-16 h-16 shrink-0 rounded-sm flex items-center justify-center"
                    style={{ background: 'var(--surface-container)' }}
                  >
                    <span
                      className="material-symbols-outlined opacity-30"
                      style={{ fontSize: '32px', color: 'var(--foreground)' }}
                    >
                      videogame_asset
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-headline text-xl font-extrabold tracking-tight text-foreground leading-tight">
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="font-inter text-xs text-muted-foreground mt-1">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Score */}
          <div className="text-right shrink-0">
            <span
              className="font-headline text-3xl font-black"
              style={{ color: isSuccess ? 'var(--primary)' : 'var(--tertiary)' }}
            >
              {score}
            </span>
            <span className="font-label text-[10px] text-muted-foreground block tracking-widest uppercase">
              /100
            </span>
          </div>
        </div>

        {/* Tags row */}
        {tags && tags.length > 0 && (
          <div className="flex gap-2 mt-4 flex-wrap relative z-10">
            {tags.map((tag) => (
              <span
                key={tag}
                className="font-label text-[9px] tracking-widest uppercase px-2 py-1"
                style={{
                  color:       isSuccess ? 'var(--primary)'   : 'var(--tertiary)',
                  background:  isSuccess
                    ? 'rgba(232,0,90,0.08)'
                    : 'rgba(0,122,140,0.10)',
                  border: `1px solid ${isSuccess ? 'rgba(232,0,90,0.20)' : 'rgba(0,122,140,0.25)'}`,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ── Ranks 2–5 ─────────────────────────────────────────────────── */
  return (
    <div
      className="group flex items-center gap-4 bg-card p-5 transition-all duration-300 hover:bg-surface-container-low"
      style={borderStyle}
    >
      {/* Rank number — large faded */}
      <span
        className="font-headline text-4xl font-black w-10 shrink-0 text-center select-none"
        style={{ color: rankColor }}
      >
        {rank}
      </span>

      {/* Title + subtitle */}
      <div className="flex-1 min-w-0">
        <h3 className="font-headline text-base font-bold tracking-tight text-foreground truncate">
          {title}
        </h3>
        {subtitle && (
          <p className="font-inter text-xs text-muted-foreground mt-0.5 truncate">
            {subtitle}
          </p>
        )}
      </div>

      {/* Score */}
      <div className="text-right shrink-0">
        <span
          className="font-headline text-xl font-bold"
          style={{ color: isSuccess ? 'var(--primary)' : 'var(--tertiary)' }}
        >
          {score}
        </span>
        <span className="font-label text-[9px] text-muted-foreground block tracking-widest uppercase">
          /100
        </span>
      </div>
    </div>
  );
}
