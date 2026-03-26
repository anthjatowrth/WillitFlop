import { Gamepad2, BarChart2, Trophy } from 'lucide-react'

const STEPS = [
  {
    num: '01',
    title: 'Décrivez votre jeu',
    desc: 'Genre, ambiance, mécaniques, style visuel… Le formulaire interactif prend moins d\'une minute.',
    detail: '12 questions · Slot machine · Quiz de langues',
    Icon: Gamepad2,
  },
  {
    num: '02',
    title: 'On analyse le marché',
    desc: 'Notre modèle compare votre concept avec des milliers de jeux Steam et IGDB pour trouver les plus proches.',
    detail: 'Steam · IGDB · Données réelles',
    Icon: BarChart2,
  },
  {
    num: '03',
    title: 'Votre verdict',
    desc: 'Score de succès, Metacritic estimé, jaquette IA, récap des facteurs clés et positionnement marché.',
    detail: 'TOP ou FLOP · Image IA · Facteurs',
    Icon: Trophy,
  },
]

export default function HowItWorks() {
  return (
    <section className="w-full px-4 sm:px-8 md:px-12 py-16 md:py-20">
      <div className="max-w-4xl mx-auto">

        <div className="wif-section-label">Fonctionnement</div>
        <h2
          className="font-orbitron font-bold text-foreground"
          style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', letterSpacing: '0.04em', marginBottom: '56px' }}
        >
          Comment ça marche ?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 relative">

          {/* Ligne connecteur horizontale (desktop) */}
          <div
            className="hidden md:block absolute"
            style={{
              top: '40px',
              left: 'calc(16.666% + 20px)',
              right: 'calc(16.666% + 20px)',
              height: '1px',
              background: 'linear-gradient(90deg, var(--wif-pink), var(--wif-cyan))',
              opacity: 0.3,
              zIndex: 0,
            }}
          />

          {STEPS.map((step, i) => (
            <div key={step.num} className="relative flex flex-col" style={{ padding: '0 24px 0', zIndex: 1 }}>

              {/* Icône dans un cercle */}
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    border: i === 0
                      ? '2px solid var(--wif-pink)'
                      : i === 1
                        ? '2px solid color-mix(in srgb, var(--wif-pink) 50%, var(--wif-cyan))'
                        : '2px solid var(--wif-cyan)',
                    background: i === 0
                      ? 'color-mix(in srgb, var(--wif-pink) 8%, var(--wif-bg2))'
                      : i === 1
                        ? 'color-mix(in srgb, var(--wif-cyan) 6%, var(--wif-bg2))'
                        : 'color-mix(in srgb, var(--wif-cyan) 8%, var(--wif-bg2))',
                  }}
                >
                  <step.Icon
                    size={22}
                    style={{
                      color: i === 0 ? 'var(--wif-pink)' : i === 1 ? 'color-mix(in srgb, var(--wif-pink) 50%, var(--wif-cyan))' : 'var(--wif-cyan)',
                    }}
                  />
                </div>

                {/* Numéro */}
                <div
                  className="font-orbitron font-black"
                  style={{
                    fontSize: '2.8rem',
                    lineHeight: 1,
                    color: i === 0 ? 'var(--wif-pink)' : i === 1 ? 'color-mix(in srgb, var(--wif-pink) 40%, var(--wif-cyan))' : 'var(--wif-cyan)',
                    opacity: 0.18,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {step.num}
                </div>
              </div>

              {/* Titre */}
              <h3
                className="font-orbitron font-bold text-foreground"
                style={{ fontSize: '0.88rem', letterSpacing: '0.04em', marginBottom: '10px' }}
              >
                {step.title}
              </h3>

              {/* Description */}
              <p
                className="text-muted-foreground font-exo leading-relaxed"
                style={{ fontSize: '0.85rem', marginBottom: '14px' }}
              >
                {step.desc}
              </p>

              {/* Détail technique */}
              <div
                className="font-space-mono uppercase"
                style={{
                  fontSize: '0.6rem',
                  letterSpacing: '0.18em',
                  color: i === 0 ? 'var(--wif-pink)' : 'var(--wif-cyan)',
                  opacity: 0.7,
                }}
              >
                {step.detail}
              </div>

            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
