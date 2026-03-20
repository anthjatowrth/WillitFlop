/**
 * GameRankCard — core reusable card for both success and flop leaderboards.
 * Rank 1 is visually dominant with a crown; ranks 2–5 show image + details too.
 */
export default function GameRankCard({
  rank,
  title,
  subtitle,
  score,
  image,
  tags,
  creator,
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
        ? { borderLeft: '6px solid #cbd5e1' }
        : { borderLeft: '6px solid rgba(0,122,140,0.60)' };
    }
    if (rank === 3) {
      return isSuccess
        ? { borderLeft: '6px solid rgba(217,119,6,0.50)' }
        : { borderLeft: '6px solid rgba(0,122,140,0.40)' };
    }
    return {};
  })();

  /* ── Rank number faded text color ──────────────────────────────── */
  const rankColor = rank <= 3 ? '#94a3b8' : '#cbd5e1';

  /* ── Decorative bg icon (rank 1 only) ──────────────────────────── */
  const bgIcon = isSuccess ? 'military_tech' : 'thumb_down';

  /* ── Halo shadow classes (rank 1 only) ─────────────────────────── */
  const haloBase  = isSuccess
    ? 'shadow-[0_0_40px_rgba(185,0,63,0.12)]'
    : 'shadow-[0_0_40px_rgba(0,102,114,0.12)]';
  const haloHover = isSuccess
    ? 'hover:shadow-[0_0_60px_rgba(185,0,63,0.22)]'
    : 'hover:shadow-[0_0_60px_rgba(0,102,114,0.22)]';

  /* ── Thumbnail shared between rank layouts ──────────────────────── */
  function Thumbnail({ size = 'md' }) {
    const cls = size === 'lg'
      ? 'w-16 h-16 rounded-sm'
      : 'w-10 h-10 rounded-sm';
    const iconSize = size === 'lg' ? '32px' : '20px';

    if (image) {
      return (
        <img
          src={image}
          alt={title}
          className={`${cls} object-cover shrink-0`}
        />
      );
    }
    return (
      <div
        className={`${cls} shrink-0 flex items-center justify-center`}
        style={{ background: 'var(--surface-container)' }}
      >
        <span
          className="material-symbols-outlined opacity-30"
          style={{ fontSize: iconSize, color: 'var(--foreground)' }}
        >
          videogame_asset
        </span>
      </div>
    );
  }

  if (isFirst) {
    /* Crown: gold for success, wood-brown for flop */
    const crownColor  = isSuccess ? '#FFD700' : '#8B5E3C';
    const crownGlow   = isSuccess
      ? '0 0 12px rgba(255,215,0,0.55)'
      : '0 0 12px rgba(139,94,60,0.45)';

    return (
      <div className="relative">
        {/* Crown badge — floats above the card */}
        <div className="flex justify-start pl-8 mb-[-10px] relative z-20 pointer-events-none select-none">
          <span
            style={{
              fontSize: '28px',
              filter: `drop-shadow(${crownGlow})`,
              color: crownColor,
            }}
          >
            👑
          </span>
        </div>

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

              {/* Thumbnail + title */}
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <Thumbnail size="lg" />
                  <div>
                    <h3 className="font-headline text-xl font-extrabold tracking-tight text-foreground leading-tight">
                      {title}
                    </h3>
                    {creator && (
                      <p
                        className="font-label text-[11px] tracking-widest uppercase font-bold mt-1"
                        style={{ color: isSuccess ? 'var(--color-gold)' : 'var(--tertiary)' }}
                      >
                        by {creator}
                      </p>
                    )}
                    {subtitle && (
                      <p className="font-inter text-xs text-muted-foreground mt-0.5">
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
                    color:      isSuccess ? 'var(--primary)'  : 'var(--tertiary)',
                    background: isSuccess
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
      </div>
    );
  }

  /* ── Ranks 2–5 — image + details ───────────────────────────────── */
  return (
    <div
      className="group flex items-center gap-4 bg-card p-4 transition-all duration-300 hover:bg-surface-container-low"
      style={borderStyle}
    >
      {/* Rank number — large faded */}
      <span
        className="font-headline text-3xl font-black w-8 shrink-0 text-center select-none"
        style={{ color: rankColor }}
      >
        {rank}
      </span>

      {/* Thumbnail */}
      <Thumbnail size="sm" />

      {/* Title + creator + subtitle */}
      <div className="flex-1 min-w-0">
        <h3 className="font-headline text-base font-bold tracking-tight text-foreground truncate">
          {title}
        </h3>
        {creator && (
          <p
            className="font-label text-[10px] tracking-widest uppercase font-bold truncate"
            style={{ color: isSuccess ? 'var(--color-gold)' : 'var(--tertiary)' }}
          >
            by {creator}
          </p>
        )}
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
