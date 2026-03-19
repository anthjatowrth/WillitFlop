const STEPS = [
  {
    num: '01',
    title: 'Décrivez votre jeu',
    desc: 'Genre, plateforme cible, budget estimé, univers, multijoueur… Remplissez le formulaire en moins d\'une minute.',
    icon: '🎮',
  },
  {
    num: '02',
    title: 'On analyse le marché',
    desc: 'Notre système compare votre concept avec des milliers de jeux réels issus de Steam et IGDB pour trouver les plus proches.',
    icon: '📊',
  },
  {
    num: '03',
    title: 'Votre résultat',
    desc: 'Score de viabilité, image générée par IA, synopsis et rapport comparatif : tout pour évaluer les chances de votre jeu.',
    icon: '✅',
  },
]

export default function HowItWorks() {
  return (
    <section className="w-full" style={{ background: 'var(--wif-bg2)', padding: '72px 48px' }}>
      <div className="max-w-4xl mx-auto">

        <div className="wif-section-label">Fonctionnement</div>
        <h2
          className="font-orbitron font-bold text-foreground"
          style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', letterSpacing: '0.04em', marginBottom: '48px' }}
        >
          Comment ça marche ?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {STEPS.map((step, i) => (
            <div key={step.num} className="relative flex flex-col" style={{ padding: '28px' }}>

              {/* Flèche entre les étapes */}
              {i < STEPS.length - 1 && (
                <div
                  className="hidden md:block absolute font-orbitron font-bold text-primary"
                  style={{ right: '-12px', top: '36px', fontSize: '1.2rem', zIndex: 10 }}
                >
                  →
                </div>
              )}

              {/* Numéro */}
              <div
                className="font-orbitron font-black text-primary"
                style={{ fontSize: '2.5rem', lineHeight: 1, marginBottom: '12px', opacity: 0.15 }}
              >
                {step.num}
              </div>

              {/* Icône */}
              <div style={{ fontSize: '1.8rem', marginBottom: '14px' }}>{step.icon}</div>

              {/* Titre */}
              <h3
                className="font-orbitron font-bold text-foreground"
                style={{ fontSize: '0.85rem', letterSpacing: '0.04em', marginBottom: '10px' }}
              >
                {step.title}
              </h3>

              {/* Description */}
              <p
                className="text-muted-foreground font-exo leading-relaxed"
                style={{ fontSize: '0.85rem' }}
              >
                {step.desc}
              </p>

            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
