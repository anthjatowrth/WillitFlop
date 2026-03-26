export default function KpiCard({ label, value, icon, color = 'var(--wif-pink)', sub }) {
  return (
    <div
      className="bg-card border border-border/30 p-6 relative overflow-hidden flex flex-col gap-2"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex justify-between items-start">
        <p className="font-inter text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
        <span className="material-symbols-outlined opacity-20 text-3xl">{icon}</span>
      </div>
      <p className="font-space-grotesk text-4xl font-bold leading-none" style={{ color }}>
        {value ?? '—'}
      </p>
      {sub && <p className="font-inter text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}
