export default function InsightBox({ icon = 'insights', title, children, standalone = false }) {
  const inner = (
    <div className="flex gap-4">
      <span
        className="material-symbols-outlined shrink-0 mt-0.5"
        style={{ fontSize: '18px', color: 'var(--wif-cyan)' }}
      >
        {icon}
      </span>
      <div className="flex-1">
        {title && (
          <p className="font-space-grotesk text-sm font-bold text-foreground mb-1.5">{title}</p>
        )}
        <p className="font-inter text-sm text-muted-foreground leading-relaxed">{children}</p>
      </div>
    </div>
  )
  if (standalone) {
    return <div className="bg-card border border-border/30 p-6">{inner}</div>
  }
  return <div className="mt-5 pt-5 border-t border-border/30">{inner}</div>
}
