export default function CommunityScoreBlock({ positive, total }) {
  if (!total) return (
    <div className="flex flex-col items-center justify-center py-4 border border-border flex-1">
      <span className="font-label text-[10px] tracking-widest uppercase text-muted-foreground">Score Communauté</span>
      <span className="font-headline text-4xl font-black text-muted-foreground/30 mt-1">N/A</span>
    </div>
  )
  const pct = Math.round((positive / total) * 100)
  const color = pct >= 70 ? 'var(--wif-success)' : pct >= 50 ? 'var(--wif-warn)' : 'var(--wif-danger)'
  return (
    <div className="flex flex-col items-center justify-center py-4 border flex-1" style={{ borderColor: color }}>
      <span className="font-label text-[10px] tracking-widest uppercase" style={{ color }}>
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
          <span className="font-label text-[10px] text-muted-foreground/60">↑ {positive.toLocaleString()}</span>
          <span className="font-label text-[10px] text-muted-foreground/60">↓ {(total - positive).toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}
