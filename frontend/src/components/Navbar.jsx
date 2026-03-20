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

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('wif-theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <header className="sticky top-0 z-50 glass-panel bg-background/80 shadow-xl border-b-0">
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
                    ? 'text-primary border-b-2 border-primary pb-1 font-bold text-sm'
                    : 'text-foreground/60 hover:text-primary transition-colors text-sm'
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Right — CTA + dark mode toggle */}
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 text-sm font-bold text-foreground/60 hover:bg-muted transition-all duration-200 rounded-sm">
            Connexion
          </button>
          <NavLink
            to="/minigame"
            className="px-5 py-2 bg-primary text-primary-foreground font-bold text-sm rounded-sm shadow-lg active:scale-95 duration-100"
          >
            Start Prediction
          </NavLink>

          <button
            onClick={() => setDark(d => !d)}
            aria-label={dark ? 'Passer en mode clair' : 'Passer en mode sombre'}
            className="flex items-center justify-center w-8 h-8 border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors rounded-sm"
          >
            <span
              className="material-symbols-outlined select-none"
              style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}
            >
              {dark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>
      </nav>
    </header>
  )
}
