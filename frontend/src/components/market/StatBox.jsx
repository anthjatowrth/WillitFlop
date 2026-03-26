export default function StatBox({ items }) {
  return (
    <div className="flex flex-wrap gap-6 mt-5 pt-4 border-t border-border/30">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-0.5">
          <span className="font-inter text-[10px] uppercase tracking-widest text-muted-foreground">{item.label}</span>
          <span className="font-space-grotesk text-lg font-bold" style={{ color: item.color || 'var(--wif-cyan)' }}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  )
}
