import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import Logo from './Logo'

const NAV_LINKS = [
  { label: 'Accueil',     to: '/',             end: true },
  { label: 'Tendances',   to: '/market' },
  { label: 'Leaderboard', to: '/leaderboard' },
  { label: 'Catalogue',   to: '/database' },
]

export default function Navbar() {
  const [dark, setDark] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('wif-theme') === 'dark'
  )
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('wif-theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <header className="sticky top-0 z-50 glass-panel bg-background/60 backdrop-blur-md shadow-xl border-b-0">
      <nav className="flex justify-between items-center w-full px-6 py-4 max-w-screen-2xl mx-auto font-space-grotesk tracking-tight">

        {/* Left — logo + nav links */}
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
                    ? 'text-primary border-b-2 border-primary pb-1 font-bold text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                    : 'text-foreground/60 hover:text-primary focus-visible:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors text-sm'
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Right — CTA + dark mode toggle + hamburger */}
        <div className="flex items-center gap-3">

          <NavLink
            to="/minigame"
            className="px-5 py-2 bg-primary text-primary-foreground font-bold text-sm rounded-sm shadow-lg hover:bg-primary/90 active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            À vous de jouer !
          </NavLink>

          <button
            onClick={() => setDark(d => !d)}
            aria-label={dark ? 'Passer en mode clair' : 'Passer en mode sombre'}
            className="flex items-center justify-center w-8 h-8 border border-border text-muted-foreground hover:border-primary hover:text-primary focus-visible:border-primary focus-visible:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors rounded-sm"
          >
            <span
              className="material-symbols-outlined select-none"
              style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}
            >
              {dark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* Hamburger — mobile only */}
          <button
            className="md:hidden flex items-center justify-center w-8 h-8 border border-border text-muted-foreground hover:border-primary hover:text-primary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors rounded-sm"
            onClick={() => setMobileOpen(o => !o)}
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileOpen}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              {mobileOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-background/95 border-t border-border px-6 py-3 flex flex-col">
          {NAV_LINKS.map(({ label, to, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                isActive
                  ? 'text-primary font-bold text-sm py-3 border-b border-border/40 focus-visible:outline-none'
                  : 'text-foreground/70 hover:text-primary text-sm py-3 border-b border-border/40 transition-colors focus-visible:outline-none focus-visible:text-primary'
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  )
}
