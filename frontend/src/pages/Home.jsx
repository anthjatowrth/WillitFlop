import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import ExplorationGrid from '../components/ExplorationGrid'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-exo bg-background text-foreground">
      <Navbar />

      <Hero />

      {/* Séparateur dégradé */}
      <div
        style={{
          height: '1px',
          margin: '0 48px',
          background: 'linear-gradient(90deg, transparent, var(--wif-border), transparent)',
        }}
      />

      {/* Section Exploration */}
      <main className="flex-1 flex flex-col items-center" style={{ padding: '72px 48px' }}>
        <div className="w-full max-w-3xl mx-auto">
          <div className="wif-section-label">Explorer</div>
          <h2 className="font-orbitron font-bold text-foreground" style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', letterSpacing: '0.04em', marginBottom: '36px' }}>
            Explorez le marché du jeu indépendant
          </h2>
        </div>

        <ExplorationGrid />
      </main>

      <Footer />
    </div>
  )
}
