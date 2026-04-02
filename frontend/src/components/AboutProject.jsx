import { Database, GitBranch, ShieldCheck, BarChart2, Target } from 'lucide-react'

const PIPELINE_STEPS = ['Collecte Steam & IGDB', 'Nettoyage & filtrage', 'ML & Scoring', 'API Backend', 'Frontend Web']

const IN_SCOPE = [
  'Genre & mécaniques de gameplay',
  'Style visuel & direction artistique',
  'Prix de vente',
  'Modes de jeu (solo, multi…)',
  'Support linguistique',
  'Niveau de polish perçu',
]

const OUT_SCOPE = [
  'Budget et stratégie marketing',
  "Notoriété du studio ou de l'éditeur",
  'Timing et fenêtre de sortie',
  'Couverture presse & influenceurs',
  'Partenariats et promotions',
  'Features techniques (VR, contrôleur…)',
]

function BlockCard({ id, accentColor, icon: Icon, title, children, style }) {
  return (
    <div
      id={id}
      style={{
        border: '1px solid var(--wif-border)',
        borderLeft: `3px solid ${accentColor}`,
        borderRadius: '12px',
        padding: '28px 28px 24px',
        background: 'var(--wif-bg)',
        ...style,
      }}
    >
      <div className="flex items-center gap-3" style={{ marginBottom: '16px' }}>
        <Icon size={17} style={{ color: accentColor, flexShrink: 0 }} />
        <h3
          className="font-orbitron font-bold"
          style={{ fontSize: '0.85rem', letterSpacing: '0.04em', color: accentColor }}
        >
          {title}
        </h3>
      </div>
      {children}
    </div>
  )
}

function BodyText({ children, style }) {
  return (
    <p className="font-exo text-muted-foreground" style={{ fontSize: '0.86rem', lineHeight: 1.75, ...style }}>
      {children}
    </p>
  )
}

export default function AboutProject() {
  return (
    <section className="w-full px-4 sm:px-8 md:px-12 py-16 md:py-20" style={{ background: 'var(--wif-bg2)' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        <div className="wif-section-label">Le projet</div>
        <h2
          className="font-orbitron font-bold text-foreground"
          style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', letterSpacing: '0.04em', marginBottom: '48px' }}
        >
          Notre démarche
        </h2>

        {/* ── Bloc 1 : Intro (pleine largeur) ── */}
        <BlockCard
          accentColor="var(--wif-pink)"
          icon={GitBranch}
          title="Un projet d'école de bout en bout"
          style={{ marginBottom: '20px' }}
        >
          <BodyText style={{ marginBottom: '20px' }}>
            WillItFlop est né dans le cadre d'un projet d'école, avec l'ambition de ne pas rester un simple
            prototype local. Nous avons conçu et déployé une pipeline complète : collecte de données, traitement,
            modèles de machine learning, API backend et application frontend, le tout accessible publiquement sur
            le web. Notre base de données repose sur des données réelles issues de Steam et IGDB, que nous avons
            récupérées, nettoyées et structurées pour alimenter l'ensemble de nos analyses.
          </BodyText>
          <div className="flex items-center flex-wrap gap-2">
            {PIPELINE_STEPS.map((step, i) => (
              <span key={step} className="flex items-center gap-2">
                <span
                  className="font-space-mono"
                  style={{
                    fontSize: '0.65rem',
                    letterSpacing: '0.1em',
                    color: 'var(--wif-pink)',
                    background: 'color-mix(in srgb, var(--wif-pink) 8%, var(--wif-bg))',
                    border: '1px solid color-mix(in srgb, var(--wif-pink) 25%, transparent)',
                    borderRadius: '6px',
                    padding: '4px 10px',
                  }}
                >
                  {step}
                </span>
                {i < PIPELINE_STEPS.length - 1 && (
                  <span style={{ color: 'var(--wif-gray)', fontSize: '0.75rem', opacity: 0.6 }}>→</span>
                )}
              </span>
            ))}
          </div>
        </BlockCard>

        {/* ── Bloc 2 : Data filter (pleine largeur) ── */}
        <BlockCard
          id="data-filter"
          accentColor="color-mix(in srgb, var(--wif-pink) 50%, var(--wif-cyan))"
          icon={Database}
          title="Une base filtrée, pas exhaustive"
          style={{ marginBottom: '20px' }}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            <BodyText>
              Steam recense des centaines de milliers de jeux. Pour construire une base utilisable et cohérente,
              nous avons fait le choix délibéré de ne retenir que les jeux ayant dépassé un seuil de{' '}
              <strong className="text-foreground">15 000 propriétaires</strong>. En dessous de ce seuil, les
              données sont trop éparses et les titres trop peu représentatifs du marché réel pour alimenter un
              modèle fiable : on parlerait davantage de bruit que de signal fort.
            </BodyText>
            <div
              className="flex items-center gap-4 shrink-0"
              style={{
                background: 'color-mix(in srgb, var(--wif-cyan) 6%, var(--wif-bg))',
                border: '1px solid color-mix(in srgb, var(--wif-cyan) 20%, transparent)',
                borderRadius: '8px',
                padding: '14px 20px',
              }}
            >
              <div className="text-center">
                <div className="font-orbitron font-black" style={{ color: 'var(--wif-cyan)', fontSize: '1.1rem' }}>50 000+</div>
                <div className="font-space-mono uppercase" style={{ fontSize: '0.52rem', letterSpacing: '0.15em', color: 'var(--wif-gray)', marginTop: '2px' }}>jeux retenus</div>
              </div>
              <div style={{ width: '1px', height: '32px', background: 'var(--wif-border)' }} />
              <div className="text-center">
                <div className="font-orbitron font-black" style={{ color: 'color-mix(in srgb, var(--wif-pink) 50%, var(--wif-cyan))', fontSize: '1.1rem' }}>≥ 15 000</div>
                <div className="font-space-mono uppercase" style={{ fontSize: '0.52rem', letterSpacing: '0.15em', color: 'var(--wif-gray)', marginTop: '2px' }}>propriétaires min.</div>
              </div>
            </div>
          </div>
        </BlockCard>

        {/* ── Grille 2 cols : Critères TOP! + Wilson ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            marginBottom: '20px',
          }}
        >
          {/* Bloc 3 : Critères TOP! */}
          <BlockCard accentColor="var(--wif-cyan)" icon={ShieldCheck} title={`Qu'est-ce qu'un jeu "TOP !" ?`}>
            <BodyText style={{ marginBottom: '20px' }}>
              Définir le succès d'un jeu indépendant n'est pas trivial. Notre critère repose sur deux seuils
              définis explicitement : le jeu doit avoir atteint un point médian de{' '}
              <strong className="text-foreground">100 000 propriétaires</strong>, et obtenir un{' '}
              <strong className="text-foreground">Wilson score supérieur à 0,75</strong>. Ces deux conditions
              doivent être réunies simultanément : un jeu très populaire mais mal noté, ou très bien noté mais
              trop confidentiel, ne sera pas considéré comme TOP.
            </BodyText>

            {/* Formule visuelle */}
            <div className="flex items-center gap-3 flex-wrap">
              {[
                { val: '100 000', sub: 'propriétaires', color: 'var(--wif-cyan)' },
                { val: '+', sub: null, color: 'var(--wif-gray)' },
                { val: '≥ 0,75', sub: 'Wilson score', color: 'var(--wif-cyan)' },
                { val: '=', sub: null, color: 'var(--wif-gray)' },
                { val: 'TOP !', sub: 'verdict', color: 'var(--wif-success)' },
              ].map(({ val, sub, color }, i) =>
                sub ? (
                  <div
                    key={i}
                    style={{
                      background: color === 'var(--wif-success)'
                        ? 'color-mix(in srgb, var(--wif-success) 10%, var(--wif-bg))'
                        : 'color-mix(in srgb, var(--wif-cyan) 6%, var(--wif-bg))',
                      border: `1px solid ${color === 'var(--wif-success)'
                        ? 'color-mix(in srgb, var(--wif-success) 25%, transparent)'
                        : 'color-mix(in srgb, var(--wif-cyan) 20%, transparent)'}`,
                      borderRadius: '8px',
                      padding: '10px 14px',
                      textAlign: 'center',
                    }}
                  >
                    <div className="font-orbitron font-black" style={{ color, fontSize: '1rem' }}>{val}</div>
                    <div className="font-space-mono uppercase" style={{ fontSize: '0.48rem', letterSpacing: '0.12em', color: 'var(--wif-gray)', marginTop: '2px' }}>{sub}</div>
                  </div>
                ) : (
                  <span key={i} style={{ color: 'var(--wif-gray)', fontSize: '1rem' }}>{val}</span>
                )
              )}
            </div>
          </BlockCard>

          {/* Bloc 4 : Wilson score */}
          <BlockCard accentColor="var(--wif-cyan)" icon={BarChart2} title="Le Wilson score : pourquoi ce choix ?">
            <BodyText style={{ marginBottom: '18px' }}>
              Le Wilson score est un intervalle de confiance appliqué aux avis positifs. Contrairement à un simple
              pourcentage brut, il tient compte du volume total d'avis : un jeu avec dix avis tous positifs est
              bien moins fiable qu'un jeu avec dix mille avis à 85 % positifs. Le Wilson score pénalise les
              petits échantillons et valorise les données abondantes, c'est ce qui rend notre mesure de la
              réputation robuste et honnête.
            </BodyText>

            {/* Mini schéma Wilson */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: '10 avis · 100 % positifs', score: '63 %', width: 63 },
                { label: '10 000 avis · 85 % positifs', score: '84 %', width: 84 },
              ].map(({ label, score, width }) => (
                <div key={label}>
                  <div className="flex justify-between font-space-mono" style={{ fontSize: '0.58rem', letterSpacing: '0.1em', color: 'var(--wif-gray)', marginBottom: '5px' }}>
                    <span>{label}</span>
                    <span style={{ color: 'var(--wif-cyan)' }}>Wilson ≈ {score}</span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', background: 'var(--wif-border)', overflow: 'hidden' }}>
                    <div style={{ width: `${width}%`, height: '100%', background: 'var(--wif-cyan)', borderRadius: '3px' }} />
                  </div>
                </div>
              ))}
            </div>

            <BodyText style={{ marginTop: '16px', fontSize: '0.8rem' }}>
              Un score brut de 100 % sur un petit échantillon est trompeur. Le Wilson score le ramène à 63 % pour
              refléter l'incertitude statistique, tandis qu'un score à 85 % sur un large volume reste à 84 %,
              presque intact, car le signal est solide.
            </BodyText>
          </BlockCard>
        </div>

        {/* ── Bloc 5 : Périmètre (pleine largeur) ── */}
        <BlockCard accentColor="var(--wif-gray)" icon={Target} title="Ce que notre analyse couvre et ce qu'elle ne couvre pas">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <BodyText style={{ marginBottom: '20px' }}>
                Nos modèles se concentrent exclusivement sur les{' '}
                <strong className="text-foreground">choix de développement intrinsèques au jeu</strong> : genre,
                mécaniques, style visuel, prix, modes de jeu et contenu. Ce sont des décisions créatives et de
                game design que le développeur maîtrise directement.
              </BodyText>
              <BodyText>
                Nous sommes dans une démarche honnête : nous mesurons le poids de certains facteurs bien définis,
                pas de tous les facteurs. Le marketing, la notoriété d'un studio ou le timing de sortie sont des
                variables tout aussi déterminantes, mais elles sont délibérément hors de notre scope.
              </BodyText>
            </div>
            <div className="grid grid-cols-2 gap-3" style={{ alignContent: 'start' }}>
              <div>
                <div className="font-space-mono uppercase" style={{ fontSize: '0.58rem', letterSpacing: '0.18em', color: 'var(--wif-success)', marginBottom: '8px' }}>
                  ✓ Analysés
                </div>
                <div className="flex flex-col gap-1.5">
                  {IN_SCOPE.map(f => (
                    <div key={f} className="font-exo" style={{ fontSize: '0.76rem', color: 'var(--foreground)', padding: '4px 9px', background: 'color-mix(in srgb, var(--wif-success) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--wif-success) 20%, transparent)', borderRadius: '5px' }}>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-space-mono uppercase" style={{ fontSize: '0.58rem', letterSpacing: '0.18em', color: 'var(--wif-danger)', marginBottom: '8px' }}>
                  ✗ Hors périmètre
                </div>
                <div className="flex flex-col gap-1.5">
                  {OUT_SCOPE.map(f => (
                    <div key={f} className="font-exo" style={{ fontSize: '0.76rem', color: 'var(--wif-gray)', padding: '4px 9px', background: 'color-mix(in srgb, var(--wif-danger) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--wif-danger) 18%, transparent)', borderRadius: '5px' }}>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </BlockCard>

      </div>
    </section>
  )
}
