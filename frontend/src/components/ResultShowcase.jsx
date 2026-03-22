import { Link } from 'react-router-dom'

// Exemple statique calqué sur la vraie ResultCard
const MOCK = {
  gameName: 'Neon Frontier',
  verdict: 'Top!',
  pct: 78.4,
  metacritic: 74,
  pricing: 19.99,
  recap: [
    { label: 'Genre',      value: 'RPG' },
    { label: 'Ambiance',   value: 'Cyberpunk, Sci-fi' },
    { label: 'Mécaniques', value: 'Roguelike, Open World' },
    { label: 'Style',      value: 'Pixel Art / Rétro' },
    { label: 'Vue',        value: 'Isométrique' },
    { label: 'Mode',       value: 'Solo, Co-op en ligne' },
    { label: 'Polish',     value: 'AA Indé' },
    { label: 'Langues',    value: '8 langues' },
    { label: 'DLC',        value: 'Oui' },
  ],
  factors: [
    { label: 'Mécaniques en vogue (roguelike, deckbuilding…)', positive: true },
    { label: 'Prix accessible : 19.99€', positive: true },
    { label: '8 langues — large audience', positive: true },
    { label: 'DLC prévu — revenus additionnels', positive: true },
    { label: 'Solo uniquement — pas de multijoueur', positive: false },
  ],
}

function SummaryRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex items-baseline gap-2 py-1" style={{ borderBottom: '1px solid var(--wif-border)' }}>
      <span className="font-label shrink-0" style={{ fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--wif-gray)', minWidth: '80px' }}>
        {label}
      </span>
      <span className="font-exo text-foreground" style={{ fontSize: '0.8rem' }}>{value}</span>
    </div>
  )
}

export default function ResultShowcase() {
  const accentColor = 'var(--wif-success)'

  return (
    <section className="w-full" style={{ padding: '72px 48px' }}>
      <div className="max-w-4xl mx-auto">

        <div className="wif-section-label">Résultat</div>
        <h2
          className="font-orbitron font-bold text-foreground"
          style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', letterSpacing: '0.04em', marginBottom: '12px' }}
        >
          Ce que vous obtenez
        </h2>
        <p className="font-exo text-muted-foreground" style={{ fontSize: '0.88rem', marginBottom: '40px' }}>
          Un exemple de résultat après simulation complète — votre analyse sera personnalisée.
        </p>

        {/* ── Carte résultat (calquée sur ResultCard) ── */}
        <div
          className="max-w-3xl mx-auto rounded-2xl overflow-hidden"
          style={{
            border: `2.5px solid ${accentColor}`,
            background: 'var(--wif-bg3)',
            boxShadow: '0 0 40px rgba(0,122,76,0.12)',
          }}
        >

          {/* Top : jaquette + verdict */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] items-start">

            {/* Jaquette placeholder */}
            <div
              className="flex flex-col items-center justify-center gap-3"
              style={{
                aspectRatio: '2/3',
                background: 'linear-gradient(135deg, #0d1b2a 0%, #1a0a2e 50%, #0d1b2a 100%)',
                borderRight: '2px solid var(--border)',
                borderBottom: '2px solid var(--border)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Grille décorative */}
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'linear-gradient(rgba(0,200,180,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,180,0.06) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }} />
              <div className="font-orbitron font-black text-center relative z-10" style={{ fontSize: '1.8rem', color: 'var(--wif-cyan-b)', lineHeight: 1.1 }}>
                NEON<br />FRONTIER
              </div>
              <div className="font-space-mono uppercase relative z-10" style={{ fontSize: '0.55rem', letterSpacing: '0.25em', color: 'rgba(0,200,180,0.5)' }}>
                Jaquette générée par IA
              </div>
            </div>

            {/* Verdict + métriques + titre + prix */}
            <div className="flex flex-col justify-center p-7 gap-6">

              {/* Verdict */}
              <div>
                <span className="font-label text-xs tracking-[0.3em] uppercase text-muted-foreground block mb-1">
                  Verdict de l'algorithme
                </span>
                <div className="font-orbitron text-7xl font-black tracking-tight leading-none" style={{ color: accentColor }}>
                  TOP !
                </div>
              </div>

              {/* Métriques */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-label text-xs tracking-[0.2em] uppercase text-muted-foreground block mb-1">Succès prédit</span>
                  <div className="font-orbitron text-4xl font-black" style={{ color: accentColor }}>{MOCK.pct}%</div>
                  <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'var(--wif-border)' }}>
                    <div className="h-full rounded-full" style={{ width: `${MOCK.pct}%`, background: accentColor, transition: 'width 0.7s' }} />
                  </div>
                </div>
                <div>
                  <span className="font-label text-xs tracking-[0.2em] uppercase text-muted-foreground block mb-1">Metacritic</span>
                  <div className="font-orbitron text-4xl font-black" style={{ color: 'var(--wif-pink)' }}>{MOCK.metacritic}</div>
                  <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'var(--wif-border)' }}>
                    <div className="h-full rounded-full" style={{ width: `${MOCK.metacritic}%`, background: 'var(--wif-pink)', transition: 'width 0.7s' }} />
                  </div>
                </div>
              </div>

              <div className="border-t border-border" />

              {/* Nom + accroche */}
              <div>
                <p className="font-headline font-bold text-3xl leading-tight mb-2">{MOCK.gameName}</p>
                <p className="font-inter text-sm text-muted-foreground italic">
                  RPG cyberpunk roguelike — un jeu à fort potentiel commercial sur le marché indé actuel.
                </p>
              </div>

              {/* Étiquette prix */}
              <div className="flex justify-center mt-2">
                <div
                  className="relative inline-flex flex-col items-center px-7 py-3 rounded-sm"
                  style={{ background: '#d63a6e', boxShadow: '3px 4px 0px rgba(0,0,0,0.3)' }}
                >
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2" style={{ background: 'var(--wif-bg)', borderColor: 'var(--wif-border)' }} />
                  <span className="font-label text-[10px] tracking-[0.3em] uppercase mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>Prix</span>
                  <span className="font-orbitron font-black text-white leading-none" style={{ fontSize: '1.4rem' }}>
                    {MOCK.pricing} €
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Séparateur */}
          <div className="border-t" style={{ borderColor: accentColor, opacity: 0.3 }} />

          {/* Bottom : récap + facteurs */}
          <div className="p-7 space-y-6">

            {/* Récapitulatif */}
            <div>
              <span className="font-label text-[9px] tracking-[0.3em] uppercase text-primary block mb-3">Récapitulatif</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <div>
                  {MOCK.recap.slice(0, 5).map(r => <SummaryRow key={r.label} label={r.label} value={r.value} />)}
                </div>
                <div>
                  {MOCK.recap.slice(5).map(r => <SummaryRow key={r.label} label={r.label} value={r.value} />)}
                </div>
              </div>
            </div>

            {/* Facteurs clés */}
            <div>
              <span className="font-label text-[10px] tracking-[0.3em] uppercase text-muted-foreground block mb-3">Facteurs clés</span>
              <div className="flex flex-col gap-2">
                {MOCK.factors.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg px-4 py-3"
                    style={{
                      background: f.positive
                        ? 'color-mix(in srgb, var(--wif-success) 12%, transparent)'
                        : 'color-mix(in srgb, var(--wif-danger) 12%, transparent)',
                      border: `1px solid ${f.positive
                        ? 'color-mix(in srgb, var(--wif-success) 35%, transparent)'
                        : 'color-mix(in srgb, var(--wif-danger) 35%, transparent)'}`,
                    }}
                  >
                    <span className="shrink-0 text-base leading-none" style={{ color: f.positive ? 'var(--wif-success)' : 'var(--wif-danger)' }}>
                      {f.positive ? '▲' : '▼'}
                    </span>
                    <span className="text-sm font-exo" style={{ color: f.positive ? 'var(--wif-success)' : 'var(--wif-danger)' }}>
                      {f.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <Link
              to="/minigame"
              className="flex items-center justify-center gap-2 font-space-mono text-xs uppercase tracking-[0.2em] px-8 py-4 bg-primary text-white hover:bg-primary/90 transition-all duration-200 active:scale-95 w-full"
              style={{ borderRadius: 0 }}
            >
              → Tester mon jeu maintenant
            </Link>

          </div>
        </div>

      </div>
    </section>
  )
}
