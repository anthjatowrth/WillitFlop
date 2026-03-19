/**
 * MarketStats page — /market
 * Bento-grid intelligence dashboard replicating the Cyber Tactile mockup.
 */
import DataSourceCard    from '../components/market/DataSourceCard'
import MarketGrowthChart from '../components/market/MarketGrowthChart'
import GenreChart        from '../components/market/GenreChart'
import TacticalAlerts    from '../components/market/TacticalAlerts'
import FeaturedAnalysis  from '../components/market/FeaturedAnalysis'

export default function Market() {
  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-12">

      {/* ── Hero Title Section ──────────────────────────────────────── */}
      <section className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="font-inter text-xs tracking-widest uppercase text-primary font-bold mb-2 block">
              Terminal / Intelligence_Dashboard
            </span>
            <h1 className="font-space-grotesk text-5xl font-bold tracking-tight text-foreground">
              Indie Market Intelligence
            </h1>
            <p className="font-manrope text-muted-foreground mt-4 max-w-2xl leading-relaxed">
              Synthesizing real-time telemetry from global storefronts to provide tactical
              advantages for indie developers and publishers.
            </p>
          </div>

          {/* Live API Status badge */}
          <div className="flex gap-2">
            <div className="bg-surface-container px-4 py-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary" style={{ fontSize: '18px' }}>
                p2p
              </span>
              <span className="font-inter text-[10px] font-bold uppercase tracking-tighter">
                Live API Status:{' '}
                <span style={{ color: 'var(--wif-success)' }}>Optimal</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bento Grid Dashboard ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <DataSourceCard />
        <MarketGrowthChart />
        <GenreChart />
        <TacticalAlerts />
      </div>

      {/* ── Featured Analysis ───────────────────────────────────────── */}
      <FeaturedAnalysis />
    </div>
  )
}
