import { Badge } from '@/components/ui/badge'

export default function Hero() {
  return (
    <section
      className="relative flex flex-col items-center justify-center text-center overflow-hidden"
      style={{ minHeight: '52vh', padding: '72px 48px' }}
    >
      {/* Grille de fond rose pâle */}
      <div className="wif-hero-grid" />

      {/* Halo lumineux central animé */}
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          width: '500px',
          height: '500px',
          background:
            'radial-gradient(circle, rgba(232,0,90,0.06) 0%, rgba(0,122,140,0.04) 50%, transparent 70%)',
          top: '50%',
          left: '50%',
          animation: 'wif-pulse 7s ease-in-out infinite',
        }}
      />

      {/* Eyebrow */}
      <p
        className="font-space-mono text-accent relative z-10"
        style={{
          fontSize: '0.65rem',
          letterSpacing: '0.4em',
          marginBottom: '1.25rem',
          opacity: 0,
          animation: 'wif-fade-up 0.6s 0.1s forwards',
        }}
      >
        // ANALYSE DE VIABILITÉ COMMERCIALE // JEU VIDÉO //
      </p>

      {/* Titre avec effet glitch */}
      <h1
        className="wif-hero-title font-orbitron font-black leading-none text-foreground relative z-10"
        style={{
          fontSize: 'clamp(3rem, 10vw, 6.5rem)',
          letterSpacing: '0.04em',
          opacity: 0,
          animation: 'wif-fade-up 0.6s 0.3s forwards',
        }}
      >
        WILL<span className="text-primary">IT</span>FLOP
      </h1>

      {/* Sous-titre */}
      <p
        className="font-space-mono text-muted-foreground uppercase relative z-10"
        style={{
          fontSize: '0.8rem',
          letterSpacing: '0.2em',
          marginTop: '1.5rem',
          opacity: 0,
          animation: 'wif-fade-up 0.6s 0.5s forwards',
        }}
      >
        Game Viability{' '}
        <span className="text-primary">Intelligence</span>{' '}
        Platform
      </p>

      {/* Badges */}
      <div
        className="flex gap-2.5 flex-wrap justify-center relative z-10"
        style={{
          marginTop: '2rem',
          opacity: 0,
          animation: 'wif-fade-up 0.6s 0.7s forwards',
        }}
      >
        <Badge variant="pink">
          <span
            className="rounded-full bg-current"
            style={{
              width: '5px',
              height: '5px',
              display: 'inline-block',
              animation: 'wif-blink 1.2s step-end infinite',
            }}
          />
          Projet en cours
        </Badge>
        <Badge variant="cyan">Data Analyst · Bootcamp 2026</Badge>
        <Badge variant="ink">Anthony &amp; Pierre</Badge>
      </div>
    </section>
  )
}
