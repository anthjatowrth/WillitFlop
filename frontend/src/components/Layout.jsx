import { NavLink, Outlet } from 'react-router-dom'
import Navbar from './Navbar'
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
      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
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

        {/* Col 4 — Connect */}
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
          <div className="mt-8 font-inter text-xs tracking-widest uppercase text-muted-foreground">
            Explorer · Bootcamp Data Analyst 2026 · Anthony &amp; Pierre
          </div>
        </div>
      </footer>
    </div>
  )
}
