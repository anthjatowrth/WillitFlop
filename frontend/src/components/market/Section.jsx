export default function Section({ title, subtitle, badge, children, className = '' }) {
  return (
    <div className={`bg-card border border-border/30 p-6 ${className}`}>
      {title && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-space-grotesk text-base font-bold text-foreground">{title}</h3>
            {subtitle && <p className="font-inter text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          {badge && (
            <span className="shrink-0 font-inter text-[10px] uppercase tracking-widest text-muted-foreground border border-border/40 px-2 py-1 whitespace-nowrap">
              {badge}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
