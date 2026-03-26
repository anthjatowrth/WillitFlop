export default function StatRow({ icon, label, value, accent = false }) {
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
