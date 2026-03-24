import { useState, useEffect, useRef, useMemo } from 'react'

// ---------------------------------------------------------------------------
// Question bank (15+ questions)
// ---------------------------------------------------------------------------
const QUESTIONS_BANK = [
  { word: 'Bonjour', lang: 'Français', answer: 'Hello', distractors: ['Goodbye', 'Please', 'Thank you'] },
  { word: '水', lang: 'Japonais', answer: 'Eau', distractors: ['Feu', 'Terre', 'Air'] },
  { word: 'Schadenfreude', lang: 'Allemand', answer: 'Joie maligne', distractors: ['Tristesse profonde', 'Nostalgie douce', 'Peur soudaine'] },
  { word: 'Saudade', lang: 'Portugais', answer: 'Mélancolie nostalgique', distractors: ['Joie intense', 'Colère froide', 'Amour passionné'] },
  { word: 'Hygge', lang: 'Danois', answer: 'Bien-être douillet', distractors: ['Froid glacial', 'Solitude choisie', 'Travail acharné'] },
  { word: 'Mamihlapinatapai', lang: 'Yaghan', answer: 'Regard complice silencieux', distractors: ['Cri de guerre', 'Danse rituelle', 'Repas festif'] },
  { word: 'Wabi-sabi', lang: 'Japonais', answer: 'Beauté dans l\'imperfection', distractors: ['Force dans la simplicité', 'Ordre dans le chaos', 'Paix intérieure'] },
  { word: 'L\'esprit de l\'escalier', lang: 'Français', answer: 'Réplique tardive', distractors: ['Montée rapide', 'Peur du vide', 'Vertige social'] },
  { word: 'Torschlusspanik', lang: 'Allemand', answer: 'Peur de rater le coche', distractors: ['Peur des espaces clos', 'Joie de finir', 'Panique matinale'] },
  { word: '缘分', lang: 'Mandarin', answer: 'Destin partagé', distractors: ['Chance solitaire', 'Tristesse collective', 'Paix éternelle'] },
  { word: 'Forelsket', lang: 'Norvégien', answer: 'Euphorie du premier amour', distractors: ['Douleur du deuil', 'Joie de la victoire', 'Calme après la tempête'] },
  { word: 'Dépaysement', lang: 'Français', answer: 'Sentiment d\'être à l\'étranger', distractors: ['Nostalgie du pays', 'Joie du voyage', 'Peur de l\'inconnu'] },
  { word: 'Gezellig', lang: 'Néerlandais', answer: 'Convivialité chaleureuse', distractors: ['Solitude agréable', 'Silence partagé', 'Ordre rassurant'] },
  { word: 'Ikigai', lang: 'Japonais', answer: 'Raison d\'être', distractors: ['Art de vivre', 'Force vitale', 'Paix intérieure'] },
  { word: 'Sobremesa', lang: 'Espagnol', answer: 'Conversation après repas', distractors: ['Sieste digestive', 'Promenade digestive', 'Café du matin'] },
  { word: 'Ubuntu', lang: 'Zoulou', answer: 'Humanité partagée', distractors: ['Courage individuel', 'Sagesse ancienne', 'Justice divine'] },
]

const SCORE_TO_LANGUAGES = { 0: 1, 1: 2, 2: 4, 3: 7, 4: 11 }
const SCORE_TO_TITLE = {
  0: 'Il va juste parler à son chat.',
  1: 'Bilingue de survie.',
  2: 'Curieux du monde !',
  3: 'Pas mal, globe-trotter !',
  4: 'Légende polyglotte !',
}

const TIMER_TOTAL = 30

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function TranslationBlitz({ onComplete }) {
  // Pick 4 random questions once
  const questions = useMemo(() => {
    const picked = shuffle(QUESTIONS_BANK).slice(0, 4)
    return picked.map(q => ({
      ...q,
      options: shuffle([q.answer, ...q.distractors]),
    }))
  }, [])

  const [answers, setAnswers] = useState({}) // { index: selectedOption }
  const [timeLeft, setTimeLeft] = useState(TIMER_TOTAL)
  const [finished, setFinished] = useState(false)
  const intervalRef = useRef(null)

  const answeredCount = Object.keys(answers).length
  const allAnswered = answeredCount === questions.length

  // Finish when all answered or timer hits 0
  useEffect(() => {
    if (finished) return
    if (allAnswered) {
      clearInterval(intervalRef.current)
      setFinished(true)
    }
  }, [allAnswered, finished])

  // Global timer
  useEffect(() => {
    if (finished) return
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(intervalRef.current)
          setFinished(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [finished])

  const handleAnswer = (qIndex, opt) => {
    if (answers[qIndex] !== undefined) return
    setAnswers(prev => ({ ...prev, [qIndex]: opt }))
  }

  // Notify parent as soon as game ends
  useEffect(() => {
    if (!finished) return
    const score = questions.filter((q, i) => answers[i] === q.answer).length
    const languageCount = SCORE_TO_LANGUAGES[score] ?? 1
    onComplete(score, languageCount)
  }, [finished]) // eslint-disable-line react-hooks/exhaustive-deps

  // Result screen
  if (finished) {
    const score = questions.filter((q, i) => answers[i] === q.answer).length
    const languageCount = SCORE_TO_LANGUAGES[score] ?? 1
    const emoji = score === 4 ? '🏆' : score >= 3 ? '🎉' : score >= 1 ? '📚' : '😅'

    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '16px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px' }}>{emoji}</div>
        <div>
          <div className="font-orbitron" style={{ fontSize: '28px', fontWeight: 900, color: 'var(--wif-pink)' }}>
            {score} / 4
          </div>
          <p className="font-exo" style={{ fontSize: '14px', color: 'var(--wif-ink)', marginTop: '6px' }}>
            {SCORE_TO_TITLE[score]}
          </p>
        </div>
        <div style={{
          background: 'var(--wif-bg3)', borderRadius: '10px',
          padding: '14px 24px', border: '1.5px solid var(--wif-pink)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
        }}>
          <span className="font-label" style={{
            fontSize: '9px', letterSpacing: '0.25em',
            textTransform: 'uppercase', opacity: 0.5,
          }}>
            Langues débloquées
          </span>
          <span className="font-orbitron" style={{ fontSize: '28px', fontWeight: 900, color: 'var(--wif-pink)' }}>
            {languageCount === 20 ? '20+' : languageCount}
          </span>
        </div>
        <p className="font-exo" style={{ fontSize: '11px', color: 'var(--wif-ink)', opacity: 0.45, fontStyle: 'italic' }}>
          Oui, tu pouvais googler. C'est fait exprès.
        </p>
      </div>
    )
  }

  // Timer color
  const timerColor = timeLeft <= 10 ? 'var(--wif-danger)' : 'var(--wif-pink)'
  const progress = (timeLeft / TIMER_TOTAL) * 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Timer bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          flex: 1, height: '6px', borderRadius: '3px',
          background: 'var(--wif-border)', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: timerColor,
            transition: 'width 1s linear, background 0.3s',
            borderRadius: '3px',
          }} />
        </div>
        <span className="font-orbitron" style={{
          fontSize: '16px', fontWeight: 900,
          color: timerColor, minWidth: '28px', textAlign: 'right',
          transition: 'color 0.3s',
        }}>
          {timeLeft}
        </span>
      </div>

      {/* Question grid 2×2 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '10px',
      }}>
        {questions.map((q, qi) => {
          const selected = answers[qi]
          const isAnswered = selected !== undefined

          return (
            <div
              key={qi}
              style={{
                background: 'var(--wif-bg3)',
                borderRadius: '10px',
                border: `1.5px solid ${isAnswered ? 'transparent' : 'var(--wif-border)'}`,
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                opacity: isAnswered ? 0.85 : 1,
                transition: 'opacity 0.3s',
              }}
            >
              {/* Question header */}
              <div style={{ textAlign: 'center' }}>
                <span className="font-label" style={{
                  fontSize: '9px', letterSpacing: '0.2em',
                  textTransform: 'uppercase', opacity: 0.5,
                  display: 'block',
                }}>
                  {q.lang}
                </span>
                <div className="font-orbitron" style={{
                  fontSize: '26px', fontWeight: 900,
                  color: 'var(--wif-pink)', margin: '4px 0 2px',
                  lineHeight: 1.1,
                }}>
                  {q.word}
                </div>
              </div>

              {/* Options 2×2 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                {q.options.map(opt => {
                  const isSelected = selected === opt
                  const isCorrect = opt === q.answer

                  let bg = 'transparent'
                  let borderColor = 'var(--wif-border)'
                  let color = 'var(--wif-ink)'
                  let opacity = 1

                  if (isAnswered) {
                    if (isCorrect) {
                      bg = 'var(--wif-success)'; borderColor = 'var(--wif-success)'; color = '#fff'
                    } else if (isSelected) {
                      bg = 'var(--wif-danger)'; borderColor = 'var(--wif-danger)'; color = '#fff'
                    } else {
                      opacity = 0.25
                    }
                  }

                  return (
                    <button
                      key={opt}
                      onClick={() => handleAnswer(qi, opt)}
                      disabled={isAnswered}
                      className="font-exo"
                      style={{
                        padding: '8px 5px',
                        borderRadius: '6px',
                        border: `1.5px solid ${borderColor}`,
                        background: bg,
                        color,
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: isAnswered ? 'default' : 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s',
                        opacity,
                        lineHeight: 1.2,
                      }}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Progress indicator */}
      <div style={{ textAlign: 'center' }}>
        <span className="font-exo" style={{ fontSize: '11px', opacity: 0.45 }}>
          {answeredCount} / {questions.length} répondues
        </span>
      </div>
    </div>
  )
}
