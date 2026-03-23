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
      <footer className="bg-surface-container-low grid grid-cols-1 md:grid-cols-5 gap-8 w-full px-8 py-12 mt-auto border-t border-border/20">

        {/* Col 1-2 — Brand */}
        <div className="md:col-span-2">
          <Logo className="text-sm" />
          <p className="text-muted-foreground font-inter text-xs leading-relaxed tracking-wider mt-4">
            Anthony Jato Wirth et Pierre Guerlais, étudiants à la Wild Code School, passionnés de data et de jeux vidéo.
            Nous avons décidé d'utiliser nos nouvelles compétences pour les appliquer sur un projet concret qui nous passionne,
            et espérons que cela vous passionnera aussi&nbsp;😊&nbsp;!
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

        {/* Col 4 — Réseaux sociaux */}
        <div>
          <h4 className="font-inter text-[11px] font-black uppercase tracking-widest text-primary mb-6">
            Réseaux sociaux
          </h4>
          <div className="space-y-4">
            {/* Anthony Jato Wirth*/}
            <div>
              <p className="font-inter text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Anthony Jato Wirth</p>
              <div className="flex gap-3">
                <a href="https://anthjatowrth.github.io/" target="_blank" rel="noopener noreferrer" title="Portfolio Anthony"
                  className="text-muted-foreground hover:text-primary transition-colors">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>language</span>
                </a>
                <a href="https://www.linkedin.com/in/anthonyjw/" target="_blank" rel="noopener noreferrer" title="LinkedIn Anthony"
                  className="text-muted-foreground hover:text-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
            {/* Pierre Guerlais*/}
            <div>
              <p className="font-inter text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Pierre Guerlais</p>
              <div className="flex gap-3">
                <a href="https://pguerlais.github.io/" target="_blank" rel="noopener noreferrer" title="Portfolio Pierre"
                  className="text-muted-foreground hover:text-primary transition-colors">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>language</span>
                </a>
                <a href="https://www.linkedin.com/in/pierreguerlais/" target="_blank" rel="noopener noreferrer" title="LinkedIn Pierre"
                  className="text-muted-foreground hover:text-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
