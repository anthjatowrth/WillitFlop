import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { buildImagePrompt } from '../utils/promptBuilder'

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

  const question = QUESTIONS[currentStep]
  const totalSteps = QUESTIONS.length

  // -------------------------------------------------------------------------
  // Handlers de mise à jour des réponses
  // -------------------------------------------------------------------------

  // Choix unique (single / yesno)
  const handleSingleSelect = (value) => {
    setAnswers(prev => ({ ...prev, [question.key]: value }))
  }

  // Multi-sélection (toggle)
  const handleMultiToggle = (value) => {
    setAnswers(prev => {
      const current = prev[question.key]
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value]
      return { ...prev, [question.key]: updated }
    })
  }

  // Champ texte libre
  const handleTextChange = (e) => {
    setAnswers(prev => ({ ...prev, [question.key]: e.target.value }))
  }

  // -------------------------------------------------------------------------
  // Validation : peut-on passer à la question suivante ?
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
  // Navigation : étape suivante ou soumission finale
  // -------------------------------------------------------------------------
  const handleNext = async () => {
    if (!canProceed()) return

    // Dernière question — envoi au backend
    if (currentStep === totalSteps - 1) {
      await submitPrediction(answers)
      return
    }

    setCurrentStep(prev => prev + 1)
  }

  // -------------------------------------------------------------------------
  // Mapping : réponses du questionnaire → champs attendus par le modèle ML
  // -------------------------------------------------------------------------
  const mapAnswersToPayload = (a) => {
    // Prix : conversion string → float
    const priceMap = {
      'Gratuit': 0,
      'Moins de 5€': 3,
      '5–15€': 10,
      '15–30€': 22,
      'Plus de 30€': 40,
    }
    const price_eur = priceMap[a.pricing] ?? null

    // Tags : regroupe les infos qualitatives secondaires
    const tags = [
      a.universe,
      a.perspective,
      a.visualStyle,
      a.playtime,
      ...a.platforms,
    ].filter(Boolean)

    // Description courte : combine description + élément iconique
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
  // Appel API — POST /predict  +  génération jaquette Pollinations (parallèle)
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
        // Appel 1 : prédiction backend (bloquant — erreur remontée)
        fetch(`${import.meta.env.VITE_API_URL}/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).then(r => {
          if (!r.ok) throw new Error(`Erreur serveur : ${r.status}`)
          return r.json()
        }),
        // Appel 2 : génération image Pollinations (non-bloquant — null si échec)
        fetch(pollinationsEndpoint)
          .then(r => r.ok ? r.blob() : null)
          .catch(() => null),
      ])

      setResult(data)
      if (imageBlob) setImageUrl(URL.createObjectURL(imageBlob))
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
      setImageLoading(false)
    }
  }

  // -------------------------------------------------------------------------
  // Remise à zéro
  // -------------------------------------------------------------------------
  const handleReset = () => {
    setAnswers(INITIAL_ANSWERS)
    setCurrentStep(0)
    setResult(null)
    setError(null)
    setImageUrl(null)
    setImageLoading(false)
  }

  // -------------------------------------------------------------------------
  // Rendu
  // -------------------------------------------------------------------------
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 font-mono" style={{ minHeight: 'calc(100vh - 72px)' }}>

        {/* Écran de résultat */}
        {result && (
          <ResultCard
            result={result}
            answers={answers}
            imageUrl={imageUrl}
            imageLoading={imageLoading}
            onReset={handleReset}
          />
        )}

        {/* Écran de chargement */}
        {isLoading && (
          <Card className="w-full max-w-xl text-center">
            <CardContent className="py-16">
              <p className="text-lg text-muted-foreground animate-pulse">
                Analyse en cours…
              </p>
            </CardContent>
          </Card>
        )}

        {/* Erreur */}
        {error && !isLoading && !result && (
          <Card className="w-full max-w-xl border-destructive">
            <CardContent className="py-8 text-center space-y-4">
              <p className="text-destructive font-semibold">Une erreur est survenue</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={handleReset}>Recommencer</Button>
            </CardContent>
          </Card>
        )}

        {/* Questionnaire */}
        {!result && !isLoading && !error && (
          <div className="w-full max-w-xl space-y-6">

            {/* Indicateur de progression */}
            <ProgressBar current={currentStep + 1} total={totalSteps} />

            {/* Carte de la question courante */}
            <Card>
              <CardHeader>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">
                  Question {currentStep + 1} / {totalSteps}
                </p>
                <CardTitle className="text-xl leading-snug mt-1">
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
                    className="w-full min-h-[100px] rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
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
                  <div className="flex gap-4">
                    {[{ label: 'Oui', value: true }, { label: 'Non', value: false }].map(({ label, value }) => (
                      <button
                        key={label}
                        onClick={() => handleSingleSelect(value)}
                        className={[
                          'flex-1 rounded-lg border-2 py-3 text-sm font-semibold transition-colors',
                          answers[question.key] === value
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background hover:border-primary hover:text-primary',
                        ].join(' ')}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Bouton suivant / soumettre */}
                <div className="pt-2">
                  <Button
                    className="w-full"
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
  )
}

// ---------------------------------------------------------------------------
// Sous-composant : barre de progression
// ---------------------------------------------------------------------------
function ProgressBar({ current, total }) {
  const pct = Math.round((current / total) * 100)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Étape {current} / {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sous-composant : grille d'options (single ou multi)
// ---------------------------------------------------------------------------
function OptionGrid({ options, selected, onSelect, multi }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map(option => {
        const isSelected = multi
          ? selected.includes(option)
          : selected === option

        return (
          <button
            key={option}
            onClick={() => onSelect(option)}
            className={[
              'rounded-lg border-2 px-3 py-2 text-sm text-left transition-colors',
              isSelected
                ? 'border-primary bg-primary text-primary-foreground font-semibold'
                : 'border-border bg-background hover:border-primary hover:text-primary',
            ].join(' ')}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sous-composant : écran de résultat
// ---------------------------------------------------------------------------
function ResultCard({ result, answers, imageUrl, imageLoading, onReset }) {
  // Le backend renvoie : { verdict: "Top!" | "Flop!", proba: float, metacritic_score: int }
  const { verdict, proba, metacritic_score } = result
  const isTop = verdict === 'Top!'
  const pct = Math.round((proba ?? 0) * 100)

  return (
    <Card className="w-full max-w-xl">
      <CardHeader className="text-center space-y-2">
        {/* Verdict */}
        <p className={`text-5xl font-black tracking-tight ${isTop ? 'text-green-500' : 'text-destructive'}`}>
          {isTop ? '🎉 TOP !' : '💀 FLOP !'}
        </p>
        <CardDescription className="text-base">
          Score de succès prédit : <span className="font-bold text-foreground">{pct}%</span>
          {metacritic_score != null && (
            <span className="ml-3 text-muted-foreground">· Metacritic estimé : {metacritic_score}</span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Jaquette générée par Pollinations */}
        {imageLoading && (
          <div className="w-full rounded-lg flex items-center justify-center" style={{ aspectRatio: '2/3', backgroundColor: '#d4d0c8' }}>
            <p className="text-xs text-muted-foreground animate-pulse">Génération de la jaquette…</p>
          </div>
        )}
        {imageUrl && !imageLoading && (
          <img
            src={imageUrl}
            alt="Jaquette du jeu"
            className="w-full rounded-lg"
          />
        )}

        {/* Résumé des choix clés */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
          <p className="font-semibold text-xs uppercase tracking-widest text-muted-foreground mb-3">
            Récapitulatif
          </p>
          <SummaryRow label="Genre" value={answers.genre} />
          <SummaryRow label="Univers" value={answers.universe} />
          <SummaryRow label="Mode de jeu" value={answers.gameMode} />
          <SummaryRow label="Style visuel" value={answers.visualStyle} />
          {answers.gameName && answers.gameName !== 'Unnamed Game' && (
            <SummaryRow label="Nom du jeu" value={answers.gameName} />
          )}
        </div>

        <Button variant="outline" className="w-full" onClick={onReset}>
          Recommencer ↺
        </Button>
      </CardContent>
    </Card>
  )
}

// Petite ligne de résumé clé / valeur
function SummaryRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  )
}
