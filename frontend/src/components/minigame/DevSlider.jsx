import imgGarage   from '../../assets/garagedev.png'
import imgIndie    from '../../assets/indiestudio.png'
import imgAA       from '../../assets/AAstudio.png'
import imgPolished from '../../assets/polishedgem.png'

const LEVELS = [
  { index: 0, label: 'Garage',       desc: '1 dev, 6 mois, du café',        img: imgGarage   },
  { index: 1, label: 'Studio Indé',  desc: 'Petite équipe, Kickstarter',     img: imgIndie    },
  { index: 2, label: 'AA Indé',      desc: '2 ans, publishers, OST dédiée',  img: imgAA       },
  { index: 3, label: 'Polished Gem', desc: 'Day 1 Perfect, 100% completion', img: imgPolished },
]

export default function DevSlider({ value, onSelect }) {
  const fillPct = value !== null && value !== undefined ? (value + 1) * 25 : 0

  return (
    <div className="flex gap-4 select-none">

      {/* ── Grille 2×2 ── */}
      <div className="flex-1 grid grid-cols-2 gap-3">
        {LEVELS.map((level) => {
          const isSelected = value === level.index
          return (
            <button
              key={level.index}
              onClick={() => onSelect(level.index)}
              className="flex flex-col overflow-hidden rounded-xl transition-all duration-200 text-left"
              style={{
                border: `2px solid ${isSelected ? 'var(--wif-pink)' : 'var(--wif-border)'}`,
                background: isSelected ? 'rgba(232,0,90,0.05)' : 'var(--wif-bg3)',
                transform: isSelected ? 'translateY(-3px)' : 'none',
                boxShadow: isSelected ? '0 6px 20px rgba(232,0,90,0.20)' : 'none',
              }}
            >
              {/* Image */}
              <div className="w-full overflow-hidden" style={{ height: '140px' }}>
                <img
                  src={level.img}
                  alt={level.label}
                  className="w-full h-full object-cover transition-transform duration-300"
                  style={{ transform: isSelected ? 'scale(1.04)' : 'scale(1)' }}
                />
              </div>

              {/* Label */}
              <div className="px-3 py-2.5 flex flex-col gap-0.5">
                <span
                  className="font-orbitron text-[11px] font-bold tracking-wide uppercase"
                  style={{ color: isSelected ? 'var(--wif-pink)' : 'var(--wif-ink)' }}
                >
                  {level.label}
                </span>
                <span
                  className="font-exo text-[10px] leading-snug"
                  style={{ color: 'var(--wif-ink)', opacity: isSelected ? 0.7 : 0.4 }}
                >
                  {level.desc}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Jauge verticale ── */}
      <div className="flex flex-col items-center gap-2" style={{ width: '32px' }}>
        {/* Label haut */}
        <span
          className="font-label text-[8px] tracking-widest uppercase text-center leading-tight"
          style={{ color: 'var(--wif-pink)', opacity: fillPct === 100 ? 1 : 0.3, transition: 'opacity 0.3s' }}
        >
          MAX
        </span>

        {/* Track */}
        <div
          className="flex-1 w-3 rounded-full overflow-hidden relative"
          style={{ background: 'var(--wif-border)' }}
        >
          {/* Fill */}
          <div
            className="absolute bottom-0 left-0 right-0 rounded-full"
            style={{
              height: `${fillPct}%`,
              background: 'linear-gradient(to top, #E8005A, #ff6b9d)',
              transition: 'height 0.5s cubic-bezier(0.34,1.3,0.64,1)',
            }}
          />
          {/* Ticks */}
          {[25, 50, 75].map(tick => (
            <div
              key={tick}
              className="absolute left-0 right-0"
              style={{ bottom: `${tick}%`, height: '1.5px', background: 'rgba(255,255,255,0.4)', zIndex: 1 }}
            />
          ))}
        </div>

        {/* Pourcentage */}
        <span
          className="font-orbitron font-black text-center"
          style={{
            fontSize: '9px',
            color: fillPct > 0 ? 'var(--wif-pink)' : 'var(--wif-ink)',
            opacity: fillPct > 0 ? 1 : 0.3,
            transition: 'all 0.3s',
          }}
        >
          {fillPct > 0 ? `${fillPct}%` : '—'}
        </span>

        {/* Label bas */}
        <span
          className="font-label text-[8px] tracking-widest uppercase text-center leading-tight"
          style={{ color: 'var(--wif-ink)', opacity: 0.3 }}
        >
          MIN
        </span>
      </div>
    </div>
  )
}
