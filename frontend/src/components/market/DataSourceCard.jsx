/**
 * DataSourceCard — "The Data Source" editorial card (col-span-4)
 * Uses only CSS variables from index.css for colors.
 */
export default function DataSourceCard() {
  return (
    <div className="md:col-span-4 bg-surface-container-lowest p-8 border border-outline-variant/15 flex flex-col justify-between relative overflow-hidden group">
      {/* Decorative background icon */}
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: '96px',
            fontVariationSettings: "'FILL' 1",
          }}
        >
          analytics
        </span>
      </div>

      {/* Content */}
      <div>
        <h2 className="font-space-grotesk text-2xl font-bold mb-6">The Data Source</h2>
        <p className="font-manrope text-sm text-muted-foreground leading-relaxed mb-6">
          Our intelligence engine aggregates telemetry from Steam, Epic Games Store, and itch.io.
          We utilize specialized APIs to track concurrent players, wishlisting velocity, and
          review sentiment analysis.
        </p>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-primary flex-shrink-0" />
            <span className="font-inter text-[11px] uppercase tracking-widest text-foreground">
              SteamDB Integration
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-tertiary flex-shrink-0" />
            <span className="font-inter text-[11px] uppercase tracking-widest text-foreground">
              Twitch API Streaming Volatility
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-muted-foreground flex-shrink-0" />
            <span className="font-inter text-[11px] uppercase tracking-widest text-foreground">
              Social Sentiment Scrapers
            </span>
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="mt-12">
        <div className="font-space-grotesk text-4xl font-black text-primary">84.2%</div>
        <div className="font-inter text-[10px] uppercase tracking-widest font-bold mt-1 text-muted-foreground">
          Global Accuracy Rating
        </div>
      </div>
    </div>
  )
}
