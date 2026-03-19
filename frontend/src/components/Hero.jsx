import { Link } from 'react-router-dom'

export default function Hero() {
    return (
      <div className="text-center max-w-3xl mx-auto mb-16">
        {/* Eyebrow */}
        <p className="text-xs tracking-[0.2em] text-primary uppercase font-mono mb-4">
          // exploration interactive · données Steam
        </p>

        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-4">
          <span className="text-black">Explore le marché du</span>
          <br />
          <span className="text-primary">jeu indépendant</span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm text-gray-500 font-mono tracking-wide mt-4">
          Choisissez un angle d'exploration – puis cliquez pour zoomer sur les données
        </p>

        {/* CTA */}
        <Link
          to="/minigame"
          className="inline-block mt-8 px-6 py-3 bg-primary text-primary-foreground text-sm font-semibold font-mono rounded-lg hover:opacity-90 transition-opacity"
        >
          Tester mon jeu →
        </Link>
      </div>
    );
  }