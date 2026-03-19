import { NavLink, Outlet } from 'react-router-dom'
import Logo from './Logo'

const NAV_LINKS = [
  { label: 'Accueil',     to: '/',             end: true },
  { label: 'Tendances',   to: '/market' },
  { label: 'Leaderboard', to: '/leaderboard' },
  { label: 'Catalogue',   to: '/database' },
]

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground technical-grid">

      {/* ── TopBar ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 glass-panel bg-background/80 shadow-xl border-b-0">
        <nav className="flex justify-between items-center w-full px-6 py-4 max-w-screen-2xl mx-auto font-space-grotesk tracking-tight">

          {/* Left: logo + nav links */}
          <div className="flex items-center gap-8">
            <NavLink to="/" aria-label="Home">
              <Logo className="text-sm" />
            </NavLink>

            <div className="hidden md:flex items-center gap-6">
              {NAV_LINKS.map(({ label, to, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    isActive
                      ? 'text-primary border-b-2 border-primary pb-1 font-bold text-sm'
                      : 'text-foreground/60 hover:text-primary transition-colors text-sm'
                  }
                >
                  {label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Right: CTA buttons */}
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 text-sm font-bold text-foreground/60 hover:bg-muted transition-all duration-200 rounded-sm">
              Connexion (en développement)
            </button>
            <NavLink
              to="/minigame"
              className="px-5 py-2 bg-primary text-primary-foreground font-bold text-sm rounded-sm shadow-lg active:scale-95 duration-100"
            >
              Start Prediction
            </NavLink>
          </div>
        </nav>
      </header>

      {/* ── Page content (Outlet) ──────────────────────────────────── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="bg-surface-container-low grid grid-cols-1 md:grid-cols-4 gap-8 w-full px-8 py-12 mt-auto border-t border-border/20">

        {/* Col 1 — Brand */}
        <div className="md:col-span-1">
          <Logo className="text-sm" />
          <p className="text-muted-foreground font-inter text-[10px] leading-relaxed uppercase tracking-wider mt-4">
            Tactical intelligence for the next generation of digital creators.
            Predict, analyze, and conquer the market.
          </p>
        </div>

        {/* Col 2 — Navigation */}
        <div>
          <h4 className="font-inter text-[11px] font-black uppercase tracking-widest text-primary mb-6">
            Navigation
          </h4>
          <ul className="space-y-3 font-inter text-xs tracking-widest uppercase">
            {NAV_LINKS.map(({ label, to, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className="text-muted-foreground hover:text-accent transition-colors"
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3 — Legal */}
        <div>
          <h4 className="font-inter text-[11px] font-black uppercase tracking-widest text-primary mb-6">
            Legal
          </h4>
          <ul className="space-y-3 font-inter text-xs tracking-widest uppercase">
            <li><a href="#" className="text-muted-foreground hover:text-accent transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="text-muted-foreground hover:text-accent transition-colors">Terms of Service</a></li>
            <li><a href="#" className="text-muted-foreground hover:text-accent transition-colors">Data Usage</a></li>
          </ul>
        </div>

        {/* Col 4 — Connect + credits */}
        <div>
          <h4 className="font-inter text-[11px] font-black uppercase tracking-widest text-primary mb-6">
            Connect
          </h4>
          <div className="flex gap-4">
            <a
              href="#"
              className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>share</span>
            </a>
            <a
              href="#"
              className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>alternate_email</span>
            </a>
          </div>
          {/* Preserve existing footer copy */}
          <div className="mt-8 font-inter text-xs tracking-widest uppercase text-muted-foreground">
            Explorer · Bootcamp Data Analyst 2026 · Anthony &amp; Pierre
          </div>
        </div>
      </footer>
    </div>
  )
}
