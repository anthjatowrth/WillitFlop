import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { buildImagePrompt } from '../utils/promptBuilder'
import { saveToLeaderboard, checkLeaderboardEligibility } from '../api/leaderboard'
import SlotMachine from '../components/minigame/SlotMachine'
import DevSlider from '../components/minigame/DevSlider'
import LanguageQuiz from '../components/minigame/LanguageQuiz'

// ---------------------------------------------------------------------------
// Définition des 12 questions du questionnaire
// ---------------------------------------------------------------------------
const QUESTIONS = [
  {
    key: 'genre',
    type: 'single',
    label: 'Quelle est la famille de ton jeu ?',
    sublabel: 'Choix unique — il détermine les tags inférés',
    options: [
      'Action / Combat',
      'Exploration / Aventure',
      'Stratégie / Gestion',
      'RPG',
      'Plateforme / Puzzle',
      'Simulation',
      'Horreur / Thriller',
      'Narratif / Visual Novel',
    ],
  },
  {
    key: 'universe',
    type: 'multi',
    label: "Quelle est l'ambiance de ton univers ?",
    sublabel: "Jusqu'à 4 choix",
    options: [
      'Dark / Mature',
      'Cozy / Wholesome',
      'Sci-fi / Futuristic',
      'Fantasy / Medieval',
      'Cyberpunk / Steampunk',
      'Post-Apocalyptique',
      'Humour / Parodie',
      'Horreur / Psychologique',
      'Historique',
      'Anime / Coloré',
    ],
    maxSelect: 4,
  },
  {
    key: 'mechanics',
    type: 'multi',
    label: 'Comment joue-t-on à ton jeu ?',
    sublabel: "Jusqu'à 5 mécaniques",
    options: [
      'Roguelike / Roguelite',
      'Open World',
      'Story Rich / Narratif',
      'Craft / Survie',
      'Tour par tour',
      'Action rapide',
      'Puzzle / Logique',
      'Deckbuilding',
      'Souls-like',
      'Sandbox',
      'Tower Defense',
      'Metroidvania',
    ],
    maxSelect: 5,
  },
  {
    key: 'visualStyle',
    type: 'single',
    label: 'Quel est le style graphique de ton jeu ?',
    sublabel: 'Choix unique — impacte le style de la jaquette générée',
    options: [
      'Pixel Art / Rétro',
      'Cell Shading / Cartoon',
      '3D Réaliste',
      'Low Poly 3D',
      'Aquarelle / Illustré',
      'Minimaliste / Flat',
    ],
  },
  {
    key: 'perspective',
    type: 'single',
    label: 'Quelle est la vue caméra principale ?',
    sublabel: 'Comment le joueur perçoit-il ton monde ?',
    options: [
      'Première personne (FPS)',
      'Troisième personne (TPS)',
      'Vue isométrique',
      'Défilement latéral (2D)',
      'Vue du dessus',
      'Point & Click',
    ],
  },
  {
    key: 'categories',
    type: 'multi',
    label: 'Qui va jouer et comment ?',
    sublabel: 'Plusieurs choix possibles',
    options: [
      'Solo uniquement',
      'Co-op local',
      'Co-op en ligne',
      'PvP compétitif',
      'Workshop / Mods',
    ],
  },
  {
    key: 'pricing',
    type: 'slotmachine',
    label: 'Quel est le prix de ton jeu ?',
    sublabel: 'Lance la machine — le marché décide.',
  },
  {
    key: 'devLevel',
    type: 'devslider',
    label: "Combien d'amour as-tu mis dans ton jeu ?",
    sublabel: 'Glisse le curseur pour définir ton niveau de polish.',
  },
  {
    key: 'hasDLC',
    type: 'yesno',
    label: 'Ton jeu aura-t-il des DLC ou du contenu payant ?',
  },
  {
    key: 'languages',
    type: 'languagequiz',
    label: 'Dans combien de langues sortira ton jeu ?',
    sublabel: 'Réponds correctement… ou pas. Internet est ton ami.',
  },
  {
    key: 'description',
    type: 'text',
    label: 'Décris ton jeu en 2-3 phrases.',
    sublabel: "Ambiance, sensation, ce que le joueur va vivre.",
    placeholder:
      'Ex: Un RPG de gestion de donjon où tu joues le méchant qui recrute des monstres et piège des héros…',
  },
  {
    key: 'gameName',
    type: 'text',
    label: "Comment s'appelle ton jeu ?",
    sublabel: "Laisse vide, on en génèrera un pour toi.",
    placeholder: 'Nom du jeu (optionnel)',
    optional: true,
  },
]

// Valeurs initiales de l'état answers
const INITIAL_ANSWERS = {
  genre: '',
  universe: [],
  mechanics: [],
  visualStyle: '',
  perspective: '',
  categories: [],
  pricing: null,
  devLevel: 1,
  hasDLC: null,
  languages: null,
  description: '',
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
      const maxSelect = question.maxSelect
      if (current.includes(value)) {
        return { ...prev, [question.key]: current.filter(v => v !== value) }
      }
      if (maxSelect && current.length >= maxSelect) return prev
      return { ...prev, [question.key]: [...current, value] }
    })
  }

  const handleTextChange = (e) => {
    setAnswers(prev => ({ ...prev, [question.key]: e.target.value }))
  }

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------
  const canProceed = () => {
    const q = QUESTIONS[currentStep]
    const value = answers[q.key]
    if (q.optional) return true
    if (q.type === 'text') return value.trim().length > 0
    if (q.type === 'multi') return value.length > 0
    if (q.type === 'yesno') return value !== null
    if (q.type === 'slotmachine') return value !== null
    if (q.type === 'devslider') return value !== null && value !== undefined
    if (q.type === 'languagequiz') return value !== null
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
  const mapAnswersToPayload = (a, descriptionEN) => {
    const price_eur = typeof a.pricing === 'number' ? a.pricing : null
    const is_free = price_eur === 0

    const achievementMap = [5, 20, 45, 80]
    const achievement_count = achievementMap[a.devLevel] ?? 20

    const genreTagMap = {
      'Action / Combat': ['Action', 'Combat', 'Fast-Paced'],
      'Exploration / Aventure': ['Adventure', 'Exploration', 'Open World'],
      'Stratégie / Gestion': ['Strategy', 'Management', 'Resource Management'],
      'RPG': ['RPG', 'Action RPG'],
      'Plateforme / Puzzle': ['Platformer', 'Puzzle', '2D Platformer'],
      'Simulation': ['Simulation', 'Casual'],
      'Horreur / Thriller': ['Horror', 'Psychological Horror', 'Thriller'],
      'Narratif / Visual Novel': ['Visual Novel', 'Story Rich', 'Narrative'],
    }
    const universeTagMap = {
      'Dark / Mature': ['Dark', 'Mature'],
      'Cozy / Wholesome': ['Cozy', 'Wholesome'],
      'Sci-fi / Futuristic': ['Sci-fi', 'Futuristic'],
      'Fantasy / Medieval': ['Fantasy', 'Medieval'],
      'Cyberpunk / Steampunk': ['Cyberpunk', 'Steampunk'],
      'Post-Apocalyptique': ['Post-apocalyptic'],
      'Humour / Parodie': ['Comedy', 'Parody'],
      'Horreur / Psychologique': ['Horror', 'Psychological'],
      'Historique': ['Historical'],
      'Anime / Coloré': ['Anime', 'Colorful'],
    }
    const mechanicsTagMap = {
      'Roguelike / Roguelite': ['Rogue-like', 'Rogue-lite'],
      'Open World': ['Open World'],
      'Story Rich / Narratif': ['Story Rich', 'Narrative'],
      'Craft / Survie': ['Crafting', 'Survival'],
      'Tour par tour': ['Turn-Based', 'Turn-Based Strategy'],
      'Action rapide': ['Action', 'Fast-Paced'],
      'Puzzle / Logique': ['Puzzle', 'Logic'],
      'Deckbuilding': ['Deckbuilding', 'Card Game'],
      'Souls-like': ['Souls-like', 'Difficult'],
      'Sandbox': ['Sandbox'],
      'Tower Defense': ['Tower Defense'],
      'Metroidvania': ['Metroidvania'],
    }

    const visualStyleTagMap = {
      'Pixel Art / Rétro':      ['Pixel Graphics', '2D', 'Retro'],
      'Cell Shading / Cartoon': ['Colorful', 'Cartoon'],
      '3D Réaliste':            ['3D', 'Realistic'],
      'Low Poly 3D':            ['Low-poly', '3D'],
      'Aquarelle / Illustré':   ['Hand-drawn', '2D'],
      'Minimaliste / Flat':     ['Minimalist'],
    }
    const perspectiveTagMap = {
      'Première personne (FPS)': ['FPS', 'First-Person'],
      'Troisième personne (TPS)': ['Third-Person'],
      'Vue isométrique':          ['Isometric'],
      'Défilement latéral (2D)':  ['Side Scroller', '2D Platformer'],
      'Vue du dessus':            ['Top-Down'],
      'Point & Click':            ['Point & Click'],
    }

    const genreTags      = genreTagMap[a.genre] || []
    const universeTags   = (a.universe || []).flatMap(u => universeTagMap[u] || [])
    const mechanicsTags  = (a.mechanics || []).flatMap(m => mechanicsTagMap[m] || [])
    const visualTags     = visualStyleTagMap[a.visualStyle] || []
    const perspTags      = perspectiveTagMap[a.perspective] || []
    const tags = [...new Set([...genreTags, ...universeTags, ...mechanicsTags, ...visualTags, ...perspTags])]

    const genreGenreMap = {
      'Action / Combat': ['Action'],
      'Exploration / Aventure': ['Adventure', 'Action'],
      'Stratégie / Gestion': ['Strategy'],
      'RPG': ['RPG', 'Adventure'],
      'Plateforme / Puzzle': ['Action', 'Casual'],
      'Simulation': ['Simulation'],
      'Horreur / Thriller': ['Action', 'Adventure'],
      'Narratif / Visual Novel': ['Adventure', 'Casual'],
    }
    const genres = genreGenreMap[a.genre] || []

    const categoryMap = {
      'Solo uniquement': ['Single-player'],
      'Co-op local': ['Single-player', 'Co-op'],
      'Co-op en ligne': ['Single-player', 'Online Co-op', 'Co-op'],
      'PvP compétitif': ['Multi-player', 'PvP', 'Online PvP'],
      'Workshop / Mods': ['Single-player', 'Steam Workshop'],
    }
    const categories = [...new Set((a.categories || []).flatMap(c => categoryMap[c] || []))]

    const short_description_clean = descriptionEN?.trim() || a.description?.trim() || null

    return {
      price_eur,
      is_free,
      has_dlc: a.hasDLC,
      is_early_access: false,
      achievement_count,
      nb_supported_languages: a.languages ?? 3,
      genres: genres.length > 0 ? genres : null,
      categories: categories.length > 0 ? categories : null,
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
      // Traduire la description en anglais — utile pour le TF-IDF (entraîné sur Steam EN)
      // et pour Pollinations qui génère de meilleures images avec des prompts EN.
      // Silencieux en cas d'échec : on garde le texte original.
      let descriptionEN = rawAnswers.description?.trim() || ''
      if (descriptionEN) {
        try {
          const tr = await fetch(`${import.meta.env.VITE_API_URL}/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texts: [descriptionEN] }),
          })
          if (tr.ok) {
            const { translations } = await tr.json()
            descriptionEN = translations[0] || descriptionEN
          }
        } catch { /* silencieux — fallback sur le texte original */ }
      }

      const payload = mapAnswersToPayload(rawAnswers, descriptionEN)

      const encodedPrompt = encodeURIComponent(buildImagePrompt({
        genre:        rawAnswers.genre,
        universe:     rawAnswers.universe,
        mechanics:    rawAnswers.mechanics,
        visualStyle:  rawAnswers.visualStyle,
        perspective:  rawAnswers.perspective,
        categories:   rawAnswers.categories,
        description:  descriptionEN,
        game_name:    rawAnswers.gameName,
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
              12 questions — notre algorithme prédit le destin de ton jeu
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
                    maxSelect={question.maxSelect}
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

                {/* Machine à sous — prix */}
                {question.type === 'slotmachine' && (
                  <SlotMachine
                    onSelect={(v) => setAnswers(prev => ({ ...prev, pricing: v }))}
                  />
                )}

                {/* Slider de polish dev */}
                {question.type === 'devslider' && (
                  <DevSlider
                    value={answers.devLevel}
                    onSelect={(v) => setAnswers(prev => ({ ...prev, devLevel: v }))}
                  />
                )}

                {/* Quiz des langues */}
                {question.type === 'languagequiz' && (
                  <LanguageQuiz
                    onSelect={(v) => setAnswers(prev => ({ ...prev, languages: v }))}
                  />
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
function OptionGrid({ options, selected, onSelect, multi, maxSelect }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map(option => {
        const isSelected = multi ? selected.includes(option) : selected === option
        const isDisabled = multi && maxSelect && !isSelected && selected.length >= maxSelect
        return (
          <button
            key={option}
            onClick={() => !isDisabled && onSelect(option)}
            disabled={isDisabled}
            className="rounded-lg border-2 px-3 py-3 text-sm text-left transition-all font-exo"
            style={
              isSelected
                ? { borderColor: 'var(--wif-pink)', background: 'var(--wif-pink)', color: '#fff', fontWeight: 600 }
                : isDisabled
                  ? { borderColor: 'var(--wif-border)', background: 'transparent', color: 'var(--wif-ink)', opacity: 0.35, cursor: 'not-allowed' }
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

  const polishLabels = ['Garage', 'Studio Indé', 'AA Indé', 'Polished Gem']

  return (
    <div className="space-y-10">

      {/* ── Verdict hero ──────────────────────────────────────────── */}
      <section className="text-center space-y-3">
        <span className="font-label text-[10px] tracking-[0.3em] uppercase text-muted-foreground block">
          Verdict de l'algorithme
        </span>
        <div
          className="font-orbitron text-7xl md:text-8xl font-black tracking-tight leading-none"
          style={{ color: isTop ? 'var(--wif-success)' : 'var(--wif-danger)' }}
        >
          {isTop ? 'TOP !' : 'FLOP !'}
        </div>
        {leaderboardAdded && (
          <div className="flex justify-center">
            <Badge variant="ink">🏆 Inscrit au Leaderboard du mois !</Badge>
          </div>
        )}
      </section>

      {/* ── Métriques ─────────────────────────────────────────────── */}
      <div className="max-w-xl mx-auto grid grid-cols-2 gap-4">
        {/* Succès prédit */}
        <div style={{
          background: 'var(--wif-bg3)',
          borderRadius: '12px',
          padding: '20px',
          border: `1.5px solid ${isTop ? 'var(--wif-success)' : 'var(--wif-danger)'}`,
          textAlign: 'center',
        }}>
          <span className="font-label text-[9px] tracking-[0.25em] uppercase text-muted-foreground block mb-2">
            Succès prédit
          </span>
          <div
            className="font-orbitron text-4xl font-black"
            style={{ color: isTop ? 'var(--wif-success)' : 'var(--wif-danger)' }}
          >
            {pct}%
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: isTop ? 'var(--wif-success)' : 'var(--wif-danger)' }}
            />
          </div>
        </div>

        {/* Metacritic estimé */}
        <div style={{
          background: 'var(--wif-bg3)',
          borderRadius: '12px',
          padding: '20px',
          border: '1.5px solid var(--wif-pink)',
          textAlign: 'center',
        }}>
          <span className="font-label text-[9px] tracking-[0.25em] uppercase text-muted-foreground block mb-2">
            Metacritic estimé
          </span>
          <div className="font-orbitron text-4xl font-black" style={{ color: 'var(--wif-pink)' }}>
            {metacritic_score != null ? Math.round(metacritic_score) : '—'}
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${metacritic_score ?? 0}%`, background: 'var(--wif-pink)' }}
            />
          </div>
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
            <SummaryRow label="Ambiance" value={answers.universe?.join(', ')} />
            <SummaryRow label="Mécaniques" value={answers.mechanics?.join(', ')} />
            <SummaryRow label="Style" value={answers.visualStyle} />
            <SummaryRow label="Vue" value={answers.perspective} />
            <SummaryRow label="Mode" value={answers.categories?.join(', ')} />
            <SummaryRow
              label="Prix"
              value={
                answers.pricing != null
                  ? answers.pricing === 0 ? 'Gratuit' : `${answers.pricing}€`
                  : null
              }
            />
            <SummaryRow label="Polish" value={polishLabels[answers.devLevel] ?? null} />
            <SummaryRow
              label="Langues"
              value={answers.languages ? `${answers.languages} langues` : null}
            />
            <SummaryRow
              label="DLC"
              value={
                answers.hasDLC === true ? 'Oui'
                : answers.hasDLC === false ? 'Non'
                : null
              }
            />
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
