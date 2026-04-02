export default function Footer() {
    return (
      <footer className="w-full flex flex-col sm:flex-row items-start justify-between px-8 py-6 border-t border-border bg-secondary gap-8">
        {/* Logo + présentation */}
        <div className="flex flex-col gap-2 max-w-xs">
          <div className="text-xs font-bold tracking-widest uppercase">
            <span className="text-foreground">WILL</span>
            <span className="text-primary">I</span>
            <span className="text-foreground">T</span>
            <span className="text-primary">FLOP</span>
          </div>
          <p className="text-xs text-muted-foreground font-label leading-relaxed">
            Anthony Jato Wirth et Pierre Guerlais, étudiants à la Wild Code School, passionnés de data et de jeux vidéo.
            Nous avons décidé d'utiliser nos nouvelles compétences pour les appliquer sur un projet concret qui nous passionne,
            et espérons que cela vous passionnera aussi&nbsp;:)&nbsp;!
          </p>
        </div>

        {/* Réseaux sociaux */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-foreground/70">Réseaux sociaux</p>
          <div className="flex flex-col gap-1 text-xs font-label">
            <a href="https://anthjatowrth.github.io/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline focus-visible:underline focus-visible:outline-none">
              Portfolio : Anthony
            </a>
            <a href="https://pguerlais.github.io/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline focus-visible:underline focus-visible:outline-none">
              Portfolio : Pierre
            </a>
            <a href="https://www.linkedin.com/in/anthonyjw/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary hover:underline focus-visible:text-primary focus-visible:underline focus-visible:outline-none transition-colors">
              LinkedIn : Anthony
            </a>
            <a href="https://www.linkedin.com/in/pierreguerlais/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary hover:underline focus-visible:text-primary focus-visible:underline focus-visible:outline-none transition-colors">
              LinkedIn : Pierre
            </a>
          </div>
        </div>
      </footer>
    );
  }
