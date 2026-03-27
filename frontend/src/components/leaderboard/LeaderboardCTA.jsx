const ICON_CARDS = [
  { icon: 'monitoring',  label: 'Analytique',  rotate: '-rotate-6'  },
  { icon: 'database',    label: 'Données',     rotate: 'rotate-3'   },
  { icon: 'psychology',  label: 'Prédiction',  rotate: '-rotate-2'  },
]

export default function LeaderboardCTA() {
  return (
    <section
      className="relative overflow-hidden mt-16 px-8 py-12 md:py-16"
      style={{ background: 'var(--surface-container-low)' }}
    >
      {/* Decorative large background icon */}
      <span
        className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 select-none pointer-events-none"
        style={{ fontSize: '320px', color: 'var(--foreground)', opacity: 0.03 }}
      >
        query_stats
      </span>

      <div className="relative z-10 max-w-screen-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">

        {/* Left — text + CTA */}
        <div className="max-w-xl">
          <span className="font-label text-[10px] tracking-[0.3em] uppercase text-primary block mb-4">
            Défiez l'algorithme
          </span>
          <h2 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tighter text-foreground leading-tight mb-4">
            Vous pensez battre<br />l'algorithme ?
          </h2>
          <p className="font-inter text-sm text-muted-foreground leading-relaxed mb-8 max-w-md">
            Soumettez les données de votre jeu et laissez notre moteur prédictif l'évaluer face au classement.
            Les meilleurs sont mis à jour chaque mois — et si c'était votre tour ?
          </p>
          <button
            className="px-6 py-3 font-headline font-bold text-sm tracking-wide transition-all duration-300 hover:opacity-90 active:scale-95"
            style={{
              background: 'var(--primary)',
              color:      'var(--primary-foreground)',
            }}
          >
            Soumettre mon jeu
          </button>
        </div>

        {/* Right — three rotated icon cards (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-4">
          {ICON_CARDS.map(({ icon, label, rotate }) => (
            <div
              key={icon}
              className={`${rotate} flex flex-col items-center justify-center gap-2 w-24 h-28 transition-all duration-300 hover:scale-105`}
              style={{
                background:  'var(--card)',
                border:      '1px solid var(--border)',
                boxShadow:   '0 4px 24px rgba(0,0,0,0.06)',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '36px', color: 'var(--primary)' }}
              >
                {icon}
              </span>
              <span className="font-label text-[9px] tracking-widest uppercase text-muted-foreground">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
