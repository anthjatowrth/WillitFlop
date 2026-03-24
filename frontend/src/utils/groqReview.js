const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL   = 'llama-3.3-70b-versatile'

const FAKE_SOURCES = [
  'GameOver Mag', 'PixelPress', 'Level Up Weekly', 'IndieScope', 'Controller Weekly',
  'GameZone FR', 'JoyPad', 'DigitalPlay', 'GamerPulse', 'Respawn Review',
  'NoClip.fr', 'The Save Point', 'BossRoom', 'Reload Magazine', 'PolyCount',
  'Slash & Loot', 'XP Chronicle', 'Softcore Review', 'The Checkpoint', 'Insert Coin',
]

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function buildPrompt({ verdict, metacritic_score, answers }) {
  const isTop   = verdict === 'Top!'
  const meta    = metacritic_score != null ? parseFloat(metacritic_score.toFixed(1)) : null
  const tone    = isTop ? 'positive' : 'négatif'
  const pct     = answers.pct ?? null

  // Intensity descriptor
  let intensity = 'modéré'
  if (meta !== null) {
    if (isTop) {
      if (meta >= 80) intensity = 'très enthousiaste'
      else if (meta >= 65) intensity = 'enthousiaste'
      else intensity = 'prudemment positif'
    } else {
      if (meta < 45) intensity = 'sévère, presque assassin'
      else if (meta < 60) intensity = 'clairement négatif'
      else intensity = 'déçu mais nuancé'
    }
  }

  const details = [
    answers.genre       && `Genre : ${answers.genre}`,
    answers.universe?.length    && `Ambiances : ${answers.universe.join(', ')}`,
    answers.mechanics?.length   && `Mécaniques : ${answers.mechanics.join(', ')}`,
    answers.visualStyle && `Style visuel : ${answers.visualStyle}`,
    answers.categories?.length  && `Mode de jeu : ${answers.categories.join(', ')}`,
    answers.description?.trim() && `Concept du jeu : "${answers.description.trim()}"`,
  ].filter(Boolean).join('\n')

  const metaLine = meta !== null
    ? `Le Metacritic prédit est de ${meta}/100.`
    : 'Aucun score Metacritic disponible.'

  return `Tu es un critique de jeux vidéo professionnel qui écrit une courte review fictive (2-3 phrases maximum, ~60 mots) pour un jeu vidéo hypothétique.

Ton de la review : ${tone}, intensité : ${intensity}.
${metaLine}

Caractéristiques du jeu :
${details || 'Non précisées.'}

Règles strictes :
- Écris uniquement la review, sans introduction, sans explication, sans guillemets autour de la review entière.
- La review doit être en français, percutante, dans le style d'un magazine ou site de jeux vidéo.
- Mentionne 1 ou 2 éléments concrets issus des caractéristiques du jeu.
- Termine par un mot-verdict stylisé entre parenthèses (ex: (Incontournable.), (À éviter.), (Passable.), (Chef-d'œuvre !), (Décevant.), etc.)
- Ne cite jamais le nom d'un vrai jeu ni d'une vraie série.`
}

/**
 * Génère une fake review via l'API Groq.
 *
 * @param {object} params
 * @param {string}  params.verdict         - 'Top!' ou 'Flop!'
 * @param {number}  [params.metacritic_score]
 * @param {object}  params.answers         - réponses brutes du formulaire
 * @returns {Promise<{ text: string, source: string }>}
 */
export async function generateFakeReview({ verdict, metacritic_score, answers }) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  if (!apiKey) throw new Error('VITE_GROQ_API_KEY manquante')

  const prompt = buildPrompt({ verdict, metacritic_score, answers })

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model:       GROQ_MODEL,
      messages:    [{ role: 'user', content: prompt }],
      temperature: 0.85,
      max_tokens:  180,
    }),
  })

  if (!res.ok) throw new Error(`Groq API error: ${res.status}`)

  const data   = await res.json()
  const text   = data.choices?.[0]?.message?.content?.trim() ?? ''
  const source = pickRandom(FAKE_SOURCES)

  return { text, source }
}
