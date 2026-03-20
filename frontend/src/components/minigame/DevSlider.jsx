const LEVELS = [
  { index: 0, label: 'Garage', desc: '1 dev, 6 mois, du café' },
  { index: 1, label: 'Studio Indé', desc: 'Petite équipe, Kickstarter' },
  { index: 2, label: 'AA Indé', desc: '2 ans, publishers, OST dédiée' },
  { index: 3, label: 'Polished Gem', desc: 'Day 1 Perfect, 100% completion' },
]

export default function DevSlider({ value, onSelect }) {
  const level = LEVELS[value] ?? LEVELS[1]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Level display card */}
      <div style={{
        background: 'var(--wif-bg3)',
        borderRadius: '12px',
        padding: '20px',
        border: '2px solid var(--wif-border)',
        textAlign: 'center',
        minHeight: '80px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}>
        <span
          className="font-orbitron"
          style={{ fontSize: '20px', fontWeight: 900, color: 'var(--wif-pink)' }}
        >
          {level.label}
        </span>
        <span
          className="font-exo"
          style={{ fontSize: '13px', color: 'var(--wif-ink)', opacity: 0.7, marginTop: '6px' }}
        >
          {level.desc}
        </span>
      </div>

      {/* Progress segments */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {LEVELS.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: '6px',
              borderRadius: '3px',
              background: i <= value ? 'var(--wif-pink)' : 'var(--wif-border)',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>

      {/* Slider */}
      <input
        type="range"
        min={0}
        max={3}
        step={1}
        value={value}
        onChange={e => onSelect(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--wif-pink)', cursor: 'pointer' }}
      />

      {/* Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {LEVELS.map((l, i) => (
          <span
            key={i}
            className="font-label"
            style={{
              fontSize: '9px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: i === value ? 'var(--wif-pink)' : 'var(--wif-ink)',
              opacity: i === value ? 1 : 0.45,
              transition: 'all 0.2s',
              textAlign: 'center',
              flex: 1,
            }}
          >
            {l.label}
          </span>
        ))}
      </div>
    </div>
  )
}
