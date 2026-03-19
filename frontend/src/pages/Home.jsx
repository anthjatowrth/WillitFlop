import Hero from '../components/Hero'
import PromiseSection from '../components/PromiseSection'
import HowItWorks from '../components/HowItWorks'
import ResultShowcase from '../components/ResultShowcase'
import ExplorationGrid from '../components/ExplorationGrid'

const Divider = () => (
  <div style={{
    height: '1px',
    margin: '0 48px',
    background: 'linear-gradient(90deg, transparent, var(--wif-border), transparent)',
  }} />
)

export default function Home() {
  return (
    <>
      <Hero />

      <Divider />

      <PromiseSection />

      <Divider />

      <HowItWorks />

      <Divider />

      <ResultShowcase />

      <Divider />

      {/* Section Exploration */}
      <section className="flex flex-col items-center" style={{ padding: '72px 48px' }}>
        <div className="w-full max-w-4xl mx-auto">
          <div className="wif-section-label">Explorer</div>
          <h2
            className="font-orbitron font-bold text-foreground"
            style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', letterSpacing: '0.04em', marginBottom: '36px' }}
          >
            Explorez le marché du jeu indépendant
          </h2>
        </div>
        <ExplorationGrid />
      </section>
    </>
  )
}
