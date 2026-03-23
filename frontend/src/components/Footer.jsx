export default function Footer() {
    return (
      <footer className="w-full flex items-start justify-between px-8 py-6 border-t border-gray-200 bg-[#EEECE6] gap-8">
        {/* Logo + présentation */}
        <div className="flex flex-col gap-2 max-w-md">
          <div className="text-xs font-bold tracking-widest uppercase">
            <span className="text-black">WILL</span>
            <span className="text-primary">I</span>
            <span className="text-black">T</span>
            <span className="text-primary">FLOP</span>
          </div>
          <p className="text-xs text-gray-500 font-mono leading-relaxed">
            Anthony Jato Wirth et Pierre Guerlais — étudiants à la Wild Code School, passionnés de data et de jeux vidéo.
            Nous avons décidé d'utiliser nos nouvelles compétences pour les appliquer sur un projet concret qui nous passionne,
            et espérons que cela vous passionnera aussi&nbsp;:)&nbsp;!
          </p>
        </div>

        {/* Réseaux sociaux */}
        <div className="flex flex-col gap-2 min-w-[180px]">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-700">Réseaux sociaux</p>
          <div className="flex flex-col gap-1 text-xs font-mono">
            <a href="https://anthjatowrth.github.io/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Portfolio — Anthony
            </a>
            <a href="https://pguerlais.github.io/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Portfolio — Pierre
            </a>
            <a href="https://www.linkedin.com/in/anthonyjw/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary hover:underline">
              LinkedIn — Anthony
            </a>
            <a href="https://www.linkedin.com/in/pierreguerlais/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary hover:underline">
              LinkedIn — Pierre
            </a>
          </div>
        </div>
      </footer>
    );
  }
