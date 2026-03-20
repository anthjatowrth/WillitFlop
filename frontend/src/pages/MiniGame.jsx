import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { buildImagePrompt } from '../utils/promptBuilder'
import { saveToLeaderboard, checkLeaderboardEligibility } from '../api/leaderboard'

// ---------------------------------------------------------------------------
// Définition des 13 questions du questionnaire
// ---------------------------------------------------------------------------
const QUESTIONS = [
  {
    key: 'description',
    type: 'text',
    label: 'Décris ton jeu en une ou deux phrases.',
    sublabel: "C'est quoi l'idée, l'ambiance, le concept central ?",
    placeholder: 'Ex: Un RPG de gestion de donjon où tu joues le méchant…',
  },
  {
    key: 'genre',
    type: 'single',
    label: 'Genre principal ?',
    options: ['Action', 'RPG', 'Stratégie', 'Simulation', 'Horreur', 'Aventure', 'Platformer', 'Puzzle', 'Sports & Course', 'Visual Novel'],
  },
  {
    key: 'universe',
    type: 'single',
    label: 'Univers / Ambiance ?',
    options: ['Fantaisie', 'Science-fiction', 'Contemporain', 'Post-apocalyptique', 'Historique', 'Cyberpunk', 'Horreur Gothique', 'Monde Enfantin'],
  },
  {
    key: 'perspective',
    type: 'single',
    label: 'Perspective caméra ?',
    options: ['Vue du dessus', 'Défilement latéral (2D)', 'Première personne (FPS)', 'Troisième personne', 'Isométrique', 'Point & click'],
  },
  {
    key: 'visualStyle',
    type: 'single',
    label: 'Style visuel ?',
    options: ['Pixel art rétro', 'Cartoon coloré', 'Sombre & réaliste', 'Aquarelle', 'Low poly 3D', 'Minimaliste'],
  },
  {
    key: 'gameMode',
    type: 'single',
    label: 'Mode de jeu ?',
    options: ['Solo', 'Coopératif multijoueur', 'Compétitif multijoueur', 'Solo avec éléments en ligne'],
  },
  {
    key: 'coreMechanic',
    type: 'single',
    label: 'Mécanique principale ?',
    options: ['Combat', 'Exploration', 'Gestion', 'Narratif', 'Construction', 'Infiltration', 'Résolution d\'énigmes', 'Craft & Collection'],
  },
  {
    key: 'playtime',
    type: 'single',
    label: 'Durée de jeu estimée ?',
    options: ['Court (< 5h)', 'Moyen (5–20h)', 'Long (20–50h)', 'Très long (50h+)', 'Rejouabilité infinie (roguelike / sandbox)'],
  },
  {
    key: 'platforms',
    type: 'multi',
    label: 'Plateforme(s) cible(s) ?',
    sublabel: 'Plusieurs choix possibles.',
    options: ['PC', 'Console', 'Mobile', 'Navigateur'],
  },
  {
    key: 'pricing',
    type: 'single',
    label: 'Modèle de prix ?',
    options: ['Gratuit', 'Moins de 5€', '5–15€', '15–30€', 'Plus de 30€'],
  },
  {
    key: 'hasDLC',
    type: 'yesno',
    label: 'Ton jeu aura-t-il des DLC ou du contenu payant supplémentaire ?',
  },
  {
    key: 'iconicElement',
    type: 'text',
    label: 'Y a-t-il un personnage central, une créature ou un lieu iconique ?',
    sublabel: 'Décris-le brièvement.',
    placeholder: 'Ex: Un dragon mécanique gardien des ruines…',
  },
  {
    key: 'gameName',
    type: 'text',
    label: 'Comment s\'appelle ton jeu ?',
    sublabel: 'Laisse vide et on en génèrera un.',
    placeholder: 'Nom du jeu (optionnel)',
    optional: true,
  },
]

// Valeurs initiales de l'état answers
const INITIAL_ANSWERS = {
  description: '',
  genre: '',
  universe: '',
  perspective: '',
  visualStyle: '',
  gameMode: '',
  coreMechanic: '',
  playtime: '',
  platforms: [],
  pricing: '',
  hasDLC: null,
  iconicElement: '',
  gameName: '',
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------
export default function MiniGame() {
  const [answers, setAnswers] = useState(INITIAL_ANSWERS)
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [imageUrl, setImageUrl] = useState(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [leaderboardAdded, setLeaderboardAdded] = useState(false)
  const [showCreatorModal, setShowCreatorModal] = useState(false)
  const [pendingLeaderboard, setPendingLeaderboard] = useState(null)

  const question = QUESTIONS[currentStep]
  const totalSteps = QUESTIONS.length

  // -------------------------------------------------------------------------
  // Handlers de mise à jour des réponses
  // -------------------------------------------------------------------------
  const handleSingleSelect = (value) => {
    setAnswers(prev => ({ ...prev, [question.key]: value }))
  }

  const handleMultiToggle = (value) => {
    setAnswers(prev => {
      const current = prev[question.key]
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value]
      return { ...prev, [question.key]: updated }
    })
  }

  const handleTextChange = (e) => {
    setAnswers(prev => ({ ...prev, [question.key]: e.target.value }))
  }

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------
  const canProceed = () => {
    const value = answers[question.key]
    if (question.optional) return true
    if (question.type === 'text') return value.trim().length > 0
    if (question.type === 'multi') return value.length > 0
    if (question.type === 'yesno') return value !== null
    return value !== ''
  }

  // -------------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------------
  const handleNext = async () => {
    if (!canProceed()) return
    if (currentStep === totalSteps - 1) {
      await submitPrediction(answers)
      return
    }
    setCurrentStep(prev => prev + 1)
  }

  // -------------------------------------------------------------------------
  // Mapping réponses → payload ML
  // -------------------------------------------------------------------------
  const mapAnswersToPayload = (a) => {
    const priceMap = {
      'Gratuit': 0,
      'Moins de 5€': 3,
      '5–15€': 10,
      '15–30€': 22,
      'Plus de 30€': 40,
    }
    const price_eur = priceMap[a.pricing] ?? null
    const tags = [a.universe, a.perspective, a.visualStyle, a.playtime, ...a.platforms].filter(Boolean)
    const descParts = [a.description, a.iconicElement].filter(v => v.trim())
    const short_description_clean = descParts.join(' ') || null

    return {
      price_eur,
      is_free: a.pricing === 'Gratuit',
      has_dlc: a.hasDLC,
      genres: a.genre ? [a.genre] : null,
      categories: [a.gameMode, a.coreMechanic].filter(Boolean),
      tags: tags.length > 0 ? tags : null,
      short_description_clean,
    }
  }

  // -------------------------------------------------------------------------
  // Appel API + génération jaquette Pollinations (parallèle)
  // -------------------------------------------------------------------------
  const submitPrediction = async (rawAnswers) => {
    setIsLoading(true)
    setImageLoading(true)
    setError(null)
    setImageUrl(null)
    try {
      const payload = mapAnswersToPayload(rawAnswers)

      const encodedPrompt = encodeURIComponent(buildImagePrompt({
        ...payload,
        description: rawAnswers.description,
        iconicElement: rawAnswers.iconicElement,
        game_name: rawAnswers.gameName,
      }))
      const negativePrompt = encodeURIComponent("text, watermark, blurry, low quality, deformed, ugly, bad anatomy, logo, signature")
      const apiKey = import.meta.env.VITE_POLLINATIONS_API_KEY
      const pollinationsEndpoint = `https://gen.pollinations.ai/image/${encodedPrompt}?model=flux&width=512&height=768&enhance=true&negative_prompt=${negativePrompt}&nologo=true&key=${apiKey}`

      const [data, imageBlob] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).then(r => {
          if (!r.ok) throw new Error(`Erreur serveur : ${r.status}`)
          return r.json()
        }),
        fetch(pollinationsEndpoint)
          .then(r => r.ok ? r.blob() : null)
          .catch(() => null),
      ])

      setResult(data)
      if (imageBlob) setImageUrl(URL.createObjectURL(imageBlob))

      // Vérifie l'éligibilité au leaderboard — si oui, affiche le modal pseudo
      const eligible = await checkLeaderboardEligibility({ verdict: data.verdict, proba: data.proba })
      if (eligible) {
        setPendingLeaderboard({ verdict: data.verdict, proba: data.proba, metacritic_score: data.metacritic_score, answers: rawAnswers, coverBlob: imageBlob })
        setShowCreatorModal(true)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
      setImageLoading(false)
    }
  }

  // -------------------------------------------------------------------------
  // Soumission du pseudo leaderboard (appelé depuis le modal)
  // -------------------------------------------------------------------------
  const handleCreatorSubmit = async (creatorName) => {
    setShowCreatorModal(false)
    if (!pendingLeaderboard) return
    const added = await saveToLeaderboard({ ...pendingLeaderboard, creator_name: creatorName || null })
    setLeaderboardAdded(added)
    setPendingLeaderboard(null)
  }

  // -------------------------------------------------------------------------
  // Reset
  // -------------------------------------------------------------------------
  const handleReset = () => {
    setAnswers(INITIAL_ANSWERS)
    setCurrentStep(0)
    setResult(null)
    setError(null)
    setImageUrl(null)
    setImageLoading(false)
    setLeaderboardAdded(false)
    setShowCreatorModal(false)
    setPendingLeaderboard(null)
  }

  // -------------------------------------------------------------------------
  // Rendu
  // -------------------------------------------------------------------------
  return (
    <div className="technical-grid min-h-full">
      {showCreatorModal && pendingLeaderboard && (
        <CreatorModal
          verdict={pendingLeaderboard.verdict}
          onSubmit={handleCreatorSubmit}
        />
      )}
      <div className="max-w-screen-lg mx-auto px-6 py-12">

        {/* ── Header — masqué sur l'écran de résultat ─────────────── */}
        {!result && !isLoading && (
          <section className="mb-10 text-center">
            <span className="font-label text-[10px] tracking-[0.3em] uppercase text-primary block mb-4">
              Game Predictor · IA 84.2%
            </span>
            <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-foreground mb-3">
              Will It <span style={{ color: 'var(--wif-pink)' }}>Flop</span> ?
            </h1>
            <p className="text-muted-foreground font-label text-xs tracking-wider">
              13 questions — notre algorithme prédit le destin de ton jeu
            </p>
          </section>
        )}

        {/* ── Chargement ──────────────────────────────────────────── */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-40 gap-6">
            <div
              className="w-14 h-14 rounded-full border-4 border-border animate-spin"
              style={{ borderTopColor: 'var(--wif-pink)' }}
            />
            <p className="font-label text-[10px] tracking-[0.35em] uppercase text-muted-foreground animate-pulse">
              Analyse en cours…
            </p>
          </div>
        )}

        {/* ── Erreur ──────────────────────────────────────────────── */}
        {error && !isLoading && !result && (
          <div className="max-w-xl mx-auto">
            <Card className="border-destructive">
              <CardContent className="py-10 text-center space-y-4">
                <span className="font-label text-[10px] tracking-[0.3em] uppercase text-destructive block">
                  Erreur système
                </span>
                <p className="font-semibold text-foreground">{error}</p>
                <Button variant="outline" onClick={handleReset}>Recommencer ↺</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Résultat ────────────────────────────────────────────── */}
        {result && (
          <ResultCard
            result={result}
            answers={answers}
            imageUrl={imageUrl}
            imageLoading={imageLoading}
            leaderboardAdded={leaderboardAdded}
            onReset={handleReset}
          />
        )}

        {/* ── Questionnaire ───────────────────────────────────────── */}
        {!result && !isLoading && !error && (
          <div className="max-w-xl mx-auto space-y-5">
            <ProgressBar current={currentStep + 1} total={totalSteps} />

            <Card>
              <CardHeader>
                <span className="font-label text-[10px] tracking-[0.3em] uppercase text-primary">
                  Question {currentStep + 1} / {totalSteps}
                </span>
                <CardTitle className="font-headline text-2xl leading-snug">
                  {question.label}
                </CardTitle>
                {question.sublabel && (
                  <CardDescription>{question.sublabel}</CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Texte libre */}
                {question.type === 'text' && (
                  <textarea
                    className="w-full min-h-[100px] rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary font-exo"
                    placeholder={question.placeholder}
                    value={answers[question.key]}
                    onChange={handleTextChange}
                  />
                )}

                {/* Choix unique */}
                {question.type === 'single' && (
                  <OptionGrid
                    options={question.options}
                    selected={answers[question.key]}
                    onSelect={handleSingleSelect}
                    multi={false}
                  />
                )}

                {/* Multi-sélection */}
                {question.type === 'multi' && (
                  <OptionGrid
                    options={question.options}
                    selected={answers[question.key]}
                    onSelect={handleMultiToggle}
                    multi={true}
                  />
                )}

                {/* Oui / Non */}
                {question.type === 'yesno' && (
                  <div className="flex gap-3">
                    {[{ label: 'Oui', value: true }, { label: 'Non', value: false }].map(({ label, value }) => (
                      <button
                        key={label}
                        onClick={() => handleSingleSelect(value)}
                        className="flex-1 rounded-lg border-2 py-4 text-sm font-semibold transition-all font-label tracking-widest uppercase"
                        style={
                          answers[question.key] === value
                            ? { borderColor: 'var(--wif-pink)', background: 'var(--wif-pink)', color: '#fff' }
                            : { borderColor: 'var(--wif-border)', background: 'transparent', color: 'var(--wif-ink)' }
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Bouton navigation */}
                <div className="pt-2">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleNext}
                    disabled={!canProceed()}
                  >
                    {currentStep === totalSteps - 1 ? 'Lancer la prédiction →' : 'Suivant →'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Barre de progression
// ---------------------------------------------------------------------------
function ProgressBar({ current, total }) {
  const pct = Math.round((current / total) * 100)
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-label text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
          Progression
        </span>
        <span className="font-label text-[10px] tracking-[0.3em] uppercase text-primary">
          {pct}%
        </span>
      </div>
      <div className="h-1 w-full rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: 'var(--wif-pink)' }}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Grille d'options (single ou multi)
// ---------------------------------------------------------------------------
function OptionGrid({ options, selected, onSelect, multi }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map(option => {
        const isSelected = multi ? selected.includes(option) : selected === option
        return (
          <button
            key={option}
            onClick={() => onSelect(option)}
            className="rounded-lg border-2 px-3 py-3 text-sm text-left transition-all font-exo"
            style={
              isSelected
                ? { borderColor: 'var(--wif-pink)', background: 'var(--wif-pink)', color: '#fff', fontWeight: 600 }
                : { borderColor: 'var(--wif-border)', background: 'transparent', color: 'var(--wif-ink)' }
            }
          >
            {isSelected && <span className="mr-1.5 text-xs opacity-80">✓</span>}
            {option}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Écran de résultat
// ---------------------------------------------------------------------------
function ResultCard({ result, answers, imageUrl, imageLoading, leaderboardAdded, onReset }) {
  const { verdict, proba, metacritic_score } = result
  const isTop = verdict === 'Top!'
  const pct = Math.round((proba ?? 0) * 100)

  return (
    <div className="space-y-10">

      {/* ── Verdict hero ──────────────────────────────────────────── */}
      <section className="text-center space-y-4">
        <span className="font-label text-[10px] tracking-[0.3em] uppercase text-muted-foreground block">
          Verdict de l'algorithme
        </span>
        <div
          className="font-orbitron text-7xl md:text-8xl font-black tracking-tight leading-none"
          style={{ color: isTop ? 'var(--wif-success)' : 'var(--wif-danger)' }}
        >
          {isTop ? 'TOP !' : 'FLOP !'}
        </div>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Badge variant={isTop ? 'cyan' : 'pink'}>
            {pct}% de succès prédit
          </Badge>
          {metacritic_score != null && (
            <Badge variant="ink">
              Metacritic estimé · {metacritic_score}
            </Badge>
          )}
          {leaderboardAdded && (
            <Badge variant="ink">
              🏆 Inscrit au Leaderboard du mois !
            </Badge>
          )}
        </div>
      </section>

      {/* ── Score bar ─────────────────────────────────────────────── */}
      <div className="max-w-xl mx-auto">
        <div className="flex justify-between items-center mb-2">
          <span className="font-label text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            Score de succès
          </span>
          <span
            className="font-headline text-lg font-bold"
            style={{ color: isTop ? 'var(--wif-success)' : 'var(--wif-danger)' }}
          >
            {pct}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: isTop ? 'var(--wif-success)' : 'var(--wif-danger)',
            }}
          />
        </div>
      </div>

      {/* ── Cover + récap ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start max-w-3xl mx-auto">

        {/* Jaquette */}
        <div>
          {imageLoading && (
            <div
              className="w-full rounded-xl flex flex-col items-center justify-center gap-3"
              style={{ aspectRatio: '2/3', background: 'var(--wif-bg3)' }}
            >
              <div
                className="w-8 h-8 rounded-full border-2 border-border animate-spin"
                style={{ borderTopColor: 'var(--wif-pink)' }}
              />
              <p className="font-label text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                Génération de la jaquette…
              </p>
            </div>
          )}
          {imageUrl && !imageLoading && (
            <img
              src={imageUrl}
              alt="Jaquette du jeu"
              className="w-full rounded-xl"
              style={{
                boxShadow: isTop
                  ? '0 8px 40px rgba(0, 122, 76, 0.2)'
                  : '0 8px 40px rgba(204, 26, 26, 0.18)',
              }}
            />
          )}
          {!imageUrl && !imageLoading && (
            <div
              className="w-full rounded-xl flex items-center justify-center"
              style={{ aspectRatio: '2/3', background: 'var(--wif-bg3)' }}
            >
              <span className="font-label text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                Aucune image
              </span>
            </div>
          )}
        </div>

        {/* Récapitulatif */}
        <Card>
          <CardHeader>
            <span className="font-label text-[10px] tracking-[0.3em] uppercase text-primary">
              Récapitulatif
            </span>
            {answers.gameName && answers.gameName !== 'Unnamed Game' && (
              <CardTitle className="font-headline text-xl">{answers.gameName}</CardTitle>
            )}
          </CardHeader>
          <CardContent className="space-y-0">
            <SummaryRow label="Genre" value={answers.genre} />
            <SummaryRow label="Univers" value={answers.universe} />
            <SummaryRow label="Mode de jeu" value={answers.gameMode} />
            <SummaryRow label="Mécanique" value={answers.coreMechanic} />
            <SummaryRow label="Style visuel" value={answers.visualStyle} />
            <SummaryRow label="Durée" value={answers.playtime} />
            <SummaryRow label="Plateforme(s)" value={answers.platforms?.join(', ')} />
            <SummaryRow label="Prix" value={answers.pricing} />
            <div className="pt-5">
              <Button variant="outline" className="w-full" onClick={onReset}>
                Recommencer ↺
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Modal — saisie du pseudo pour le leaderboard
// ---------------------------------------------------------------------------
function CreatorModal({ verdict, onSubmit }) {
  const [name, setName] = useState('')
  const isTop = verdict === 'Top!'

  const accentColor = isTop ? 'var(--wif-success)' : 'var(--wif-danger)'
  const crown = isTop ? '👑' : '👑'
  const crownStyle = isTop
    ? { filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.7))' }
    : { filter: 'drop-shadow(0 0 8px rgba(139,94,60,0.6))', color: '#8B5E3C' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-sm p-8 space-y-6"
        style={{
          background: 'var(--card)',
          borderTop: `4px solid ${accentColor}`,
          boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Crown + titre */}
        <div className="text-center space-y-2">
          <span className="text-4xl select-none" style={crownStyle}>{crown}</span>
          <h2 className="font-headline text-2xl font-extrabold tracking-tight text-foreground">
            {isTop ? 'Ton jeu entre dans le Top !' : 'Ton jeu entre dans le Flop !'}
          </h2>
          <p className="font-inter text-sm text-muted-foreground leading-relaxed">
            Entre ton nom ou pseudo pour figurer dans le classement du mois.
          </p>
        </div>

        {/* Input */}
        <div className="space-y-2">
          <label className="font-label text-[10px] tracking-[0.25em] uppercase text-muted-foreground block">
            Ton pseudo
          </label>
          <input
            type="text"
            maxLength={32}
            autoFocus
            placeholder="Ex: Commander_Void"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSubmit(name.trim())}
            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 font-exo"
            style={{ '--tw-ring-color': accentColor }}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            className="w-full"
            size="lg"
            onClick={() => onSubmit(name.trim())}
            style={name.trim() ? { background: accentColor, color: '#fff', border: 'none' } : {}}
          >
            {name.trim() ? `Confirmer — ${name.trim()}` : 'Confirmer (anonyme)'}
          </Button>
          <button
            onClick={() => onSubmit(null)}
            className="font-label text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            Passer — rester anonyme
          </button>
        </div>
      </div>
    </div>
  )
}

// Ligne clé / valeur du récapitulatif
function SummaryRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-4 py-2.5 border-b border-border/50 last:border-0">
      <span className="font-label text-[10px] tracking-[0.2em] uppercase text-muted-foreground shrink-0">
        {label}
      </span>
      <span className="text-sm font-medium text-foreground font-exo text-right">{value}</span>
    </div>
  )
}
