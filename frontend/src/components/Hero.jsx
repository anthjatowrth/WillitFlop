import { Link } from 'react-router-dom'

const STATS = [
  { value: '50 000+', label: 'jeux analysés' },
  { value: '< 1 min', label: 'pour un résultat' },
  { value: 'IA + Data', label: 'modèle hybride' },
]

export default function Hero() {
  return (
    <section
      className="flex flex-col items-center text-center technical-grid"
      style={{ padding: '90px 48px 80px' }}
    >
      {/* Eyebrow */}
      <p
        className="font-space-mono uppercase tracking-[0.22em]"
        style={{ fontSize: '0.65rem', color: 'var(--wif-cyan)', marginBottom: '40px' }}
      >
        // SI VOUS POUVEZ CRÉER UN JEU VIDÉO, ÇA SERAIT QUOI ? //
      </p>

      {/* Big logo title */}
      <h1
        className="font-orbitron font-black leading-none tracking-tight select-none wif-hero-title"
        style={{ fontSize: 'clamp(3.5rem, 11vw, 7.5rem)', marginBottom: '20px', letterSpacing: '-0.01em' }}
      >
        <span style={{ color: 'var(--wif-ink)' }}>WILL</span>
        <span style={{ color: 'var(--wif-pink)', position: 'relative', display: 'inline-block' }}>
          IT
        </span>
        <span style={{ color: 'var(--wif-ink)' }}>FLOP</span>
      </h1>

      {/* Platform tagline */}
      <p
        className="font-space-mono uppercase tracking-[0.3em]"
        style={{ fontSize: '0.72rem', color: 'var(--wif-gray)', marginBottom: '40px', letterSpacing: '0.28em' }}
      >
        LA SUCCESS STORY DES JEUX INDÉPENDANTS
      </p>

      {/* Stats rapides */}
      <div
        className="flex items-center justify-center flex-wrap gap-0 mb-10"
        style={{
          border: '1px solid var(--wif-border)',
          borderRadius: '10px',
          overflow: 'hidden',
          background: 'var(--wif-bg2)',
        }}
      >
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className="flex flex-col items-center px-7 py-4"
            style={{
              borderRight: i < STATS.length - 1 ? '1px solid var(--wif-border)' : 'none',
            }}
          >
            <span className="font-orbitron font-black text-primary" style={{ fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
              {s.value}
            </span>
            <span className="font-space-mono uppercase text-muted-foreground" style={{ fontSize: '0.55rem', letterSpacing: '0.18em', marginTop: '2px' }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* CTA principal */}
      <Link
        to="/minigame"
        className="inline-flex items-center gap-2 font-space-mono text-xs uppercase tracking-[0.2em] px-10 py-4 bg-primary text-white hover:bg-primary/90 transition-all duration-200 active:scale-95"
        style={{ borderRadius: 0, marginBottom: '20px' }}
      >
        → Tester mon jeu
      </Link>

      {/* Sous-texte rassurant */}
      <p className="font-exo text-muted-foreground" style={{ fontSize: '0.78rem' }}>
        Gratuit · Aucun compte requis · Résultat immédiat
      </p>
    </section>
  )
}
