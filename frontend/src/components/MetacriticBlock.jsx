import { getScoreAccent } from '../utils/scoreColor'

export default function MetacriticBlock({ score }) {
  const accent = getScoreAccent(score)
  if (!accent) return (
    <div className="flex flex-col items-center justify-center py-4 border border-border flex-1">
      <span className="font-label text-[10px] tracking-widest uppercase text-muted-foreground">Metacritic</span>
      <span className="font-headline text-4xl font-black text-muted-foreground/30 mt-1">N/A</span>
    </div>
  )
  return (
    <div
      className="flex flex-col items-center justify-center py-4 border flex-1"
      style={{ borderColor: `var(--${accent})` }}
    >
      <span
        className="font-label text-[10px] tracking-widest uppercase"
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
