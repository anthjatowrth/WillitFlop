import { useState, useMemo } from 'react'

const QUIZ_WORDS = [
  { word: 'Bonjour', lang: 'Français', answer: 'Hello' },
  { word: '水', lang: 'Japonais', answer: 'Eau' },
  { word: 'Serendipity', lang: 'Anglais', answer: 'Sérendipité' },
  { word: 'Schadenfreude', lang: 'Allemand', answer: 'Joie maligne' },
  { word: 'Saudade', lang: 'Portugais', answer: 'Mélancolie nostalgique' },
]

const SCORE_TO_LANGUAGES = [1, 2, 3, 5, 8, 12]

const RESULT_MESSAGES = [
  "Tu parles surtout le binaire. 1 langue, c'est déjà un début.",
  'Bilingue basique. Deux langues, mieux que zéro.',
  'Trilingual curious ! 3 langues pour commencer.',
  'Pas mal du tout ! 5 langues pour un vrai public indie.',
  'Impressionnant ! 8 langues — ton jeu va voyager loin.',
  '🌍 Légende polyglotte ! 12 langues — la planète entière peut jouer.',
]

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

export default function LanguageQuiz({ onSelect }) {
  const [currentQ, setCurrentQ] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState([]) // booleans
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [done, setDone] = useState(false)

  // Pre-shuffle options for each question once
  const allOptions = useMemo(() => {
    return QUIZ_WORDS.map((q, i) => {
      const others = QUIZ_WORDS.filter((_, j) => j !== i).map(w => w.answer)
      const distractors = shuffle(others).slice(0, 3)
      return shuffle([q.answer, ...distractors])
    })
  }, [])

  const isAnswered = selectedAnswer !== null
  const q = QUIZ_WORDS[currentQ]
  const options = allOptions[currentQ]

  const handleAnswer = (opt) => {
    if (isAnswered) return
    setSelectedAnswer(opt)
  }

  const handleNext = () => {
    const correct = selectedAnswer === q.answer
    const newCorrects = [...correctAnswers, correct]
    setCorrectAnswers(newCorrects)
    setSelectedAnswer(null)

    if (currentQ < QUIZ_WORDS.length - 1) {
      setCurrentQ(i => i + 1)
    } else {
      setDone(true)
      const score = newCorrects.filter(Boolean).length
      onSelect(SCORE_TO_LANGUAGES[score])
    }
  }

  const score = correctAnswers.filter(Boolean).length

  // Done screen
  if (done) {
    const finalScore = correctAnswers.filter(Boolean).length
    const nbLanguages = SCORE_TO_LANGUAGES[finalScore]
    const emoji = finalScore === 5 ? '🏆' : finalScore >= 3 ? '🎉' : '📚'

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px' }}>{emoji}</div>
        <div>
          <div
            className="font-orbitron"
            style={{ fontSize: '32px', fontWeight: 900, color: 'var(--wif-pink)' }}
          >
            {finalScore} / 5
          </div>
          <p className="font-exo" style={{ fontSize: '14px', color: 'var(--wif-ink)', marginTop: '8px' }}>
            {RESULT_MESSAGES[finalScore]}
          </p>
        </div>
        <div style={{
          background: 'var(--wif-bg3)',
          borderRadius: '10px',
          padding: '14px 24px',
          border: '1.5px solid var(--wif-pink)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
        }}>
          <span className="font-label" style={{ fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', opacity: 0.5 }}>
            Langues débloquées
          </span>
          <span className="font-orbitron" style={{ fontSize: '28px', fontWeight: 900, color: 'var(--wif-pink)' }}>
            {nbLanguages}
          </span>
        </div>
        <p className="font-exo" style={{ fontSize: '11px', color: 'var(--wif-ink)', opacity: 0.45, fontStyle: 'italic' }}>
          Oui, tu pouvais googler. C'est fait exprès.
        </p>
      </div>
    )
  }

  // Quiz screen
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Progress dots */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {QUIZ_WORDS.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: '4px',
              borderRadius: '2px',
              background: i < correctAnswers.length
                ? (correctAnswers[i] ? 'var(--wif-success)' : 'var(--wif-danger)')
                : i === currentQ
                  ? 'var(--wif-pink)'
                  : 'var(--wif-border)',
              opacity: i > currentQ ? 0.3 : 1,
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>

      {/* Word card */}
      <div style={{
        background: 'var(--wif-bg3)',
        borderRadius: '12px',
        padding: '24px',
        border: '2px solid var(--wif-border)',
        textAlign: 'center',
      }}>
        <span className="font-label" style={{
          fontSize: '9px',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          opacity: 0.5,
          display: 'block',
        }}>
          {q.lang}
        </span>
        <div
          className="font-orbitron"
          style={{ fontSize: '40px', fontWeight: 900, color: 'var(--wif-pink)', margin: '8px 0 6px' }}
        >
          {q.word}
        </div>
        <span className="font-exo" style={{ fontSize: '12px', opacity: 0.5 }}>
          Que signifie ce mot ?
        </span>
      </div>

      {/* Answer options */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {options.map(opt => {
          const isSelected = selectedAnswer === opt
          const isCorrect = opt === q.answer

          let borderColor = 'var(--wif-border)'
          let background = 'transparent'
          let color = 'var(--wif-ink)'
          let opacity = 1

          if (isAnswered) {
            if (isCorrect) {
              borderColor = 'var(--wif-success)'
              background = 'var(--wif-success)'
              color = '#fff'
            } else if (isSelected) {
              borderColor = 'var(--wif-danger)'
              background = 'var(--wif-danger)'
              color = '#fff'
            } else {
              opacity = 0.35
            }
          }

          return (
            <button
              key={opt}
              onClick={() => handleAnswer(opt)}
              className="font-exo"
              style={{
                padding: '12px 8px',
                borderRadius: '8px',
                border: `2px solid ${borderColor}`,
                background,
                color,
                fontSize: '13px',
                fontWeight: 600,
                cursor: isAnswered ? 'default' : 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s',
                opacity,
              }}
            >
              {opt}
            </button>
          )
        })}
      </div>

      {/* Feedback + next */}
      {isAnswered && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {selectedAnswer !== q.answer && (
            <p className="font-exo" style={{ fontSize: '12px', color: 'var(--wif-ink)', opacity: 0.65, textAlign: 'center', margin: 0 }}>
              La bonne réponse était <strong>{q.answer}</strong>
            </p>
          )}
          <button
            onClick={handleNext}
            style={{
              background: 'var(--wif-pink)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {currentQ < QUIZ_WORDS.length - 1 ? 'Question suivante →' : 'Voir les résultats →'}
          </button>
        </div>
      )}
    </div>
  )
}
