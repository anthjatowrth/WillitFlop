const DELIVERABLES = [
  { icon: '🖼️', label: 'Image de couverture', desc: 'Générée par IA à partir de votre description' },
  { icon: '✍️', label: 'Synopsis narratif',   desc: 'Présentation du jeu dans son univers' },
  { icon: '📈', label: 'Rapport marché',       desc: 'Comparaison avec des jeux similaires existants' },
  { icon: '📊', label: 'Visualisations',       desc: 'Graphiques de positionnement sur le marché' },
]

export default function ResultShowcase() {
  return (
    <section className="w-full" style={{ padding: '72px 48px' }}>
      <div className="max-w-4xl mx-auto">

        <div className="wif-section-label">Résultat</div>
        <h2
          className="font-orbitron font-bold text-foreground"
          style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', letterSpacing: '0.04em', marginBottom: '48px' }}
        >
          Ce que vous obtenez
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

          {/* Score mock */}
          <div
            className="flex flex-col items-center justify-center text-center"
            style={{
              background: 'var(--wif-white)',
              border: '2px solid var(--wif-pink)',
              borderRadius: '14px',
              padding: '48px 36px',
            }}
          >
            <div
              className="font-orbitron font-black text-primary"
              style={{ fontSize: '5rem', lineHeight: 1 }}
            >
              8.4
            </div>

            <div
              className="font-space-mono text-muted-foreground uppercase"
              style={{ fontSize: '0.6rem', letterSpacing: '0.25em', margin: '8px 0 16px' }}
            >
              Score de viabilité / 10
            </div>

            <div
              className="inline-flex items-center gap-2 font-orbitron font-bold"
              style={{
                padding: '7px 20px',
                borderRadius: '30px',
                fontSize: '0.8rem',
                background: 'rgba(0,122,76,0.1)',
                color: 'var(--wif-success)',
                border: '1px solid rgba(0,122,76,0.3)',
              }}
            >
              ✓ VIABLE
            </div>

            <p
              className="text-muted-foreground font-exo"
              style={{ fontSize: '0.8rem', marginTop: '20px', lineHeight: 1.6 }}
            >
              Exemple de score pour un RPG indépendant<br />
              multijoueur, positionné à 19,99 €
            </p>
          </div>

          {/* Liste des livrables */}
          <div className="flex flex-col gap-4">
            {DELIVERABLES.map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-4"
                style={{
                  background: 'var(--wif-white)',
                  border: '1px solid var(--wif-border)',
                  borderRadius: '10px',
                  padding: '18px 22px',
                  transition: 'border-color 0.2s',
                }}
              >
                <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <div
                    className="font-orbitron font-bold text-foreground"
                    style={{ fontSize: '0.8rem', letterSpacing: '0.04em', marginBottom: '4px' }}
                  >
                    {item.label}
                  </div>
                  <div
                    className="text-muted-foreground font-exo"
                    style={{ fontSize: '0.8rem' }}
                  >
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
