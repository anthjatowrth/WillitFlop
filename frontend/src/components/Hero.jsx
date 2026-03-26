const FEATURES = [
  {
    icon: '◈',
    value: 'Database 50 000+',
    title: 'Catalogue de jeux',
    desc: 'Base de données exhaustive avec fiches détaillées, notes, genres et historique de ventes pour chaque jeu indépendant.',
    accent: 'var(--wif-pink)',
    bg: 'color-mix(in srgb, var(--wif-pink) 6%, var(--wif-bg))',
    border: 'color-mix(in srgb, var(--wif-pink) 30%, transparent)',
  },
  {
    icon: '◉',
    value: 'Market Intel',
    title: 'Étude de marché',
    desc: 'Dashboard interactif avec la shape du marché, les tendances et les clés de succès des jeux indépendants.',
    accent: 'color-mix(in srgb, var(--wif-pink) 50%, var(--wif-cyan))',
    bg: 'color-mix(in srgb, var(--wif-cyan) 4%, color-mix(in srgb, var(--wif-pink) 4%, var(--wif-bg)))',
    border: 'color-mix(in srgb, var(--wif-pink) 30%, color-mix(in srgb, var(--wif-cyan) 30%, transparent))',
  },
  {
    icon: '▶',
    value: 'Will It Flop ?',
    title: 'Testez votre jeu',
    desc: "Créez votre concept de jeu fictif et découvrez s'il a une chance de réussir commercialement grâce à notre IA.",
    accent: 'var(--wif-cyan)',
    bg: 'color-mix(in srgb, var(--wif-cyan) 6%, var(--wif-bg))',
    border: 'color-mix(in srgb, var(--wif-cyan) 30%, transparent)',
  },
]

export default function Hero() {
  return (
    <section className="flex flex-col items-center text-center technical-grid px-4 sm:px-8 md:px-12 pt-16 md:pt-24 pb-16 md:pb-20">
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
        style={{ fontSize: '0.72rem', color: 'var(--wif-gray)', marginBottom: '52px', letterSpacing: '0.28em' }}
      >
        LA SUCCESS STORY DES JEUX INDÉPENDANTS
      </p>

      {/* Feature cards */}
      <div className="flex items-stretch justify-center flex-wrap gap-4" style={{ maxWidth: '860px', width: '100%' }}>
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="flex flex-col text-left"
            style={{
              flex: '1 1 240px',
              maxWidth: '280px',
              border: `1px solid ${f.border}`,
              borderRadius: '12px',
              background: f.bg,
              padding: '24px 20px 20px',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span style={{ color: f.accent, fontSize: '1rem', lineHeight: 1 }}>{f.icon}</span>
              <span
                className="font-orbitron font-black"
                style={{ fontSize: '0.8rem', color: f.accent, letterSpacing: '0.04em' }}
              >
                {f.value}
              </span>
            </div>
            <p
              className="font-orbitron font-bold text-foreground"
              style={{ fontSize: '0.82rem', letterSpacing: '0.02em', marginBottom: '10px' }}
            >
              {f.title}
            </p>
            <p
              className="font-exo text-muted-foreground"
              style={{ fontSize: '0.76rem', lineHeight: 1.55 }}
            >
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
