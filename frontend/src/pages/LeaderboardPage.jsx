import SuccessLeaderboard from '../components/leaderboard/SuccessLeaderboard'
import FlopLeaderboard    from '../components/leaderboard/FlopLeaderboard'
import LeaderboardCTA     from '../components/leaderboard/LeaderboardCTA'

export default function LeaderboardPage() {
  return (
    <div className="technical-grid min-h-full">
      <div className="max-w-screen-2xl mx-auto px-6 py-12">

        {/* ── Section 1 — Hero Header ──────────────────────────────── */}
        <section className="mb-14">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">

            {/* Left — breadcrumb + title */}
            <div>
              <span className="font-label text-[10px] tracking-[0.3em] uppercase text-primary block mb-3">
                Tactical Analytics
              </span>
              <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tighter text-foreground">
                Predictive Hall of Fame
              </h1>
            </div>

            {/* Right — accuracy badge */}
            <div
              className="shrink-0 px-6 py-4"
              style={{
                background:  'var(--card)',
                borderLeft:  '4px solid var(--primary)',
                boxShadow:   '0 2px 16px rgba(0,0,0,0.06)',
              }}
            >
              <span className="font-label text-[10px] tracking-[0.25em] uppercase text-muted-foreground block mb-1">
                Algorithm
              </span>
              <span
                className="font-headline text-2xl font-black tracking-tight"
                style={{ color: 'var(--primary)' }}
              >
                84.2% ACCURACY
              </span>
            </div>
          </div>
        </section>

        {/* ── Section 2 — Bento Grid ───────────────────────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-4">
          <SuccessLeaderboard />
          <FlopLeaderboard />
        </section>
      </div>

      {/* ── Section 3 — CTA Callout (full-width) ────────────────── */}
      <LeaderboardCTA />
    </div>
  )
}
