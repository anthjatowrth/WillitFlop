import { Link } from 'react-router-dom'

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
        // FICHE DE PRÉSENTATION PROJET – BOOTCAMP DATA ANALYST //
      </p>

      {/* Big logo title */}
      <h1
        className="font-exo font-black leading-none tracking-tight select-none"
        style={{ fontSize: 'clamp(3.5rem, 11vw, 7.5rem)', marginBottom: '20px', letterSpacing: '-0.01em' }}
      >
        <span style={{ color: 'var(--wif-ink)' }}>WILL</span>
        <span
          style={{
            color: 'var(--wif-pink)',
            position: 'relative',
            display: 'inline-block',
          }}
        >
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

      {/* Badges */}
      <div className="flex items-center justify-center flex-wrap gap-3" style={{ marginBottom: '56px' }}>
        <span
          className="font-inter text-[0.68rem] tracking-widest uppercase"
          style={{
            border: '1px solid var(--wif-pink)',
            color: 'var(--wif-pink)',
            padding: '6px 18px',
            borderRadius: '999px',
          }}
        >
          • Projet en cours
        </span>
        <span
          className="font-inter text-[0.68rem] tracking-widest uppercase"
          style={{
            border: '1px solid var(--wif-cyan)',
            color: 'var(--wif-cyan)',
            padding: '6px 18px',
            borderRadius: '999px',
          }}
        >
          Data Analyst · Bootcamp 2026
        </span>
        <span
          className="font-inter text-[0.68rem] tracking-widest uppercase"
          style={{
            border: '1px solid var(--wif-ink2)',
            color: 'var(--wif-ink2)',
            padding: '6px 18px',
            borderRadius: '999px',
          }}
        >
          Anthony &amp; Pierre
        </span>
      </div>

      {/* CTA */}
      <Link
        to="/minigame"
        className="inline-flex items-center gap-2 font-space-mono text-xs uppercase tracking-[0.2em] px-8 py-4 bg-primary text-white hover:bg-primary/90 transition-all duration-200 active:scale-95"
        style={{ borderRadius: 0 }}
      >
        → Tester mon jeu
      </Link>
    </section>
  )
}
