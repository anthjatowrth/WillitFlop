import { useState, useEffect, useRef } from 'react'

const REELS = [
  { id: 'audience', label: 'Audience', values: ['Niche / Culte', 'Grand public', 'AA'] },
  { id: 'duration', label: 'Durée Jeu', values: ['Court < 5h', 'Moyen 5-20h', 'Long 20h+', 'Infini'] },
  { id: 'positioning', label: 'Positionnement', values: ['Premier Prix', 'Standard', 'Premium'] },
]


function resolvePrice(audience, duration, positioning) {
  if (audience === 'Niche / Culte' && positioning === 'Premier Prix') return 0
  if (positioning === 'Premier Prix') return 4.99
  if (audience === 'Niche / Culte' && (duration === 'Court < 5h' || duration === 'Moyen 5-20h')) return 9.99
  if (audience === 'Niche / Culte') return 14.99
  if (audience === 'Grand public' && duration === 'Court < 5h') return 9.99
  if (audience === 'Grand public' && duration === 'Moyen 5-20h' && positioning === 'Standard') return 14.99
  if (audience === 'Grand public' && duration === 'Moyen 5-20h' && positioning === 'Premium') return 19.99
  if (audience === 'Grand public' && duration === 'Long 20h+') return 19.99
  if (audience === 'Grand public' && duration === 'Infini') return 14.99
  if (audience === 'AA' && positioning === 'Premium') return 24.99
  if (audience === 'AA' && positioning === 'Standard') return 19.99
  return 9.99
}

function explainPrice(audience, duration, positioning) {
  const reasons = []

  if (positioning === 'Premier Prix') {
    if (audience === 'Niche / Culte') {
      reasons.push({ icon: '🎯', text: 'Audience niche + premier prix → distribué gratuitement pour maximiser la visibilité.' })
    } else {
      reasons.push({ icon: '💸', text: "Premier prix → prix d'entrée bas pour maximiser le volume de ventes." })
    }
    return reasons
  }

  if (audience === 'Niche / Culte') {
    reasons.push({ icon: '🎯', text: 'Audience niche : communauté restreinte mais passionnée, volume limité → prix modéré.' })
  } else if (audience === 'Grand public') {
    reasons.push({ icon: '🌍', text: 'Grand public : large audience, bon équilibre accessibilité et valeur perçue.' })
  } else {
    reasons.push({ icon: '🏆', text: 'Marché AA : joueurs habitués à payer pour la qualité de production.' })
  }

  if (duration === 'Court < 5h') {
    reasons.push({ icon: '⏱️', text: 'Durée courte : contenu limité, prix plafonné pour ne pas rebuter l\'acheteur.' })
  } else if (duration === 'Moyen 5-20h') {
    reasons.push({ icon: '⏳', text: 'Durée moyenne : bon rapport heure de jeu / prix, plage intermédiaire justifiée.' })
  } else if (duration === 'Long 20h+') {
    reasons.push({ icon: '📖', text: 'Longue durée : contenu dense, valeur perçue élevée → prix premium justifié.' })
  } else {
    reasons.push({ icon: '♾️', text: 'Jeu infini (GaaS) : monétisation continue, prix d\'entrée modéré pour favoriser l\'adoption.' })
  }

  if (positioning === 'Standard') {
    reasons.push({ icon: '⚖️', text: 'Positionnement standard : milieu de gamme, accessible à la majorité des joueurs.' })
  } else {
    reasons.push({ icon: '✨', text: 'Positionnement premium : qualité de production élevée → prix fort assumé.' })
  }

  return reasons
}

export default function SlotMachine({ onSelect }) {
  const [phase, setPhase] = useState('idle') // 'idle' | 'spinning' | 'done'
  const [stoppedMask, setStoppedMask] = useState([false, false, false])
  const [displayIdx, setDisplayIdx] = useState([0, 0, 0])
  const [price, setPrice] = useState(null)
  const [relaunches, setRelaunches] = useState(2)
  const [accepted, setAccepted] = useState(false)

  const spinIntervalRef = useRef(null)
  const timeoutsRef = useRef([])

  const clearAll = () => {
    if (spinIntervalRef.current) clearInterval(spinIntervalRef.current)
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
  }

  useEffect(() => () => clearAll(), [])

  const spin = () => {
    clearAll()
    setPhase('spinning')
    setStoppedMask([false, false, false])
    setPrice(null)

    spinIntervalRef.current = setInterval(() => {
      setDisplayIdx(prev => [
        (prev[0] + 1) % REELS[0].values.length,
        (prev[1] + 1) % REELS[1].values.length,
        (prev[2] + 1) % REELS[2].values.length,
      ])
    }, 100)

    const fi = [
      Math.floor(Math.random() * REELS[0].values.length),
      Math.floor(Math.random() * REELS[1].values.length),
      Math.floor(Math.random() * REELS[2].values.length),
    ]

    timeoutsRef.current.push(setTimeout(() => {
      setStoppedMask([true, false, false])
      setDisplayIdx(prev => [fi[0], prev[1], prev[2]])
    }, 600))

    timeoutsRef.current.push(setTimeout(() => {
      setStoppedMask([true, true, false])
      setDisplayIdx(prev => [fi[0], fi[1], prev[2]])
    }, 1200))

    timeoutsRef.current.push(setTimeout(() => {
      clearInterval(spinIntervalRef.current)
      setStoppedMask([true, true, true])
      setDisplayIdx(fi)
      const p = resolvePrice(
        REELS[0].values[fi[0]],
        REELS[1].values[fi[1]],
        REELS[2].values[fi[2]],
      )
      setPrice(p)
      setPhase('done')
    }, 1800))
  }

  const effectivePrice = price

  const reelBoxStyle = (ri) => ({
    width: '140px',
    height: '72px',
    background: '#0a0a0f',
    borderRadius: '8px',
    border: `2px solid ${phase === 'done' && stoppedMask[ri] ? 'var(--wif-pink)' : 'var(--wif-border)'}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    transition: 'border-color 0.3s',
  })

  const currentValues = phase === 'done' ? {
    audience: REELS[0].values[displayIdx[0]],
    duration: REELS[1].values[displayIdx[1]],
    positioning: REELS[2].values[displayIdx[2]],
  } : null
  const explanations = currentValues ? explainPrice(currentValues.audience, currentValues.duration, currentValues.positioning) : []

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: '24px', alignItems: 'flex-start', justifyContent: 'center' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      {/* Reels */}
      <div style={{
        display: 'flex',
        gap: '12px',
        background: 'var(--wif-bg3)',
        borderRadius: '14px',
        padding: '20px',
        border: '2px solid var(--wif-border)',
      }}>
        {REELS.map((reel, ri) => {
          const isSpinning = phase === 'spinning' && !stoppedMask[ri]
          return (
            <div key={reel.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontSize: '10px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--wif-ink)',
                opacity: 0.5,
              }}>
                {reel.label}
              </span>
              <div style={reelBoxStyle(ri)}>
                <span
                  className="font-orbitron"
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: stoppedMask[ri] ? 'var(--wif-pink)' : '#888',
                    textAlign: 'center',
                    padding: '0 6px',
                    lineHeight: 1.3,
                    opacity: isSpinning ? 0.6 : 1,
                    transition: 'color 0.3s, opacity 0.15s',
                  }}
                >
                  {reel.values[displayIdx[ri]]}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Spin / Spinning button */}
      {phase !== 'done' && (
        <button
          onClick={phase === 'idle' ? spin : undefined}
          disabled={phase === 'spinning'}
          style={{
            background: phase === 'spinning' ? 'var(--wif-border)' : 'var(--wif-pink)',
            color: phase === 'spinning' ? '#888' : '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '14px 40px',
            fontSize: '18px',
            fontWeight: 700,
            cursor: phase === 'spinning' ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {phase === 'spinning' ? '⏳ En cours…' : '🎰 Lancer'}
        </button>
      )}

      {/* Done state */}
      {phase === 'done' && effectivePrice !== null && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>
          <div style={{ textAlign: 'center', animation: 'slotFadeIn 0.4s ease-out' }}>
            <span style={{
              fontSize: '10px',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'var(--wif-ink)',
              opacity: 0.5,
              display: 'block',
            }}>
              Prix résultant
            </span>
            <div
              className="font-orbitron"
              style={{ fontSize: '52px', fontWeight: 900, color: 'var(--wif-pink)', lineHeight: 1.2 }}
            >
              {effectivePrice === 0 ? 'GRATUIT' : `${effectivePrice}€`}
            </div>
          </div>

          {/* Relaunch + Accept */}
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            {relaunches > 0 && !accepted && (
              <button
                onClick={() => { setRelaunches(r => r - 1); setAccepted(false); spin() }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--wif-border)',
                  background: 'transparent',
                  color: 'var(--wif-ink)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                🔄 Relancer ({relaunches}× restant{relaunches > 1 ? 's' : ''})
              </button>
            )}
            <button
              onClick={() => { setAccepted(true); onSelect(effectivePrice) }}
              disabled={accepted}
              style={{
                flex: 2,
                padding: '14px',
                borderRadius: '8px',
                border: 'none',
                background: accepted ? 'var(--wif-border)' : 'var(--wif-pink)',
                color: '#fff',
                fontSize: '15px',
                fontWeight: 700,
                cursor: accepted ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {accepted
                ? '✓ Accepté'
                : `Accepter ${effectivePrice === 0 ? 'Gratuit' : `${effectivePrice}€`}`}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slotFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>

    {/* Panneau explicatif — visible uniquement quand le résultat est tombé */}
    {phase === 'done' && explanations.length > 0 && (
      <div style={{
        minWidth: '260px',
        maxWidth: '300px',
        background: 'var(--wif-bg3)',
        border: '1.5px solid var(--wif-border)',
        borderRadius: '14px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        animation: 'slotFadeIn 0.4s ease-out',
      }}>
        <span style={{
          fontSize: '9px',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--wif-ink)',
          opacity: 0.5,
        }}>
          Pourquoi ce prix ?
        </span>
        {explanations.map((reason, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '16px', flexShrink: 0 }}>{reason.icon}</span>
            <span style={{ fontSize: '12px', color: 'var(--wif-ink)', opacity: 0.75, lineHeight: 1.5 }}>
              {reason.text}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
  )
}
