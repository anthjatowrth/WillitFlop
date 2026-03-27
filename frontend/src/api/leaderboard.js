import { supabase } from './client'

// URL de l'API FastAPI centralisée
const API_URL = import.meta.env.VITE_API_URL

/** Retourne la période courante au format 'YYYY-MM' */
function getCurrentPeriod() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Upload un blob image dans Supabase Storage (bucket 'game-covers').
 * Opération Storage conservée côté frontend — ne transite pas par la BDD relationnelle.
 * Retourne l'URL publique permanente, ou null en cas d'échec.
 */
async function uploadCover(blob, gameName) {
  if (!blob) return null

  const slug = gameName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40)
  const fileName = `${slug}-${Date.now()}.png`

  const { error } = await supabase.storage
    .from('game-covers')
    .upload(fileName, blob, { contentType: 'image/png', upsert: false })

  if (error) {
    console.error('[Leaderboard] Erreur upload cover:', error)
    return null
  }

  const { data } = supabase.storage.from('game-covers').getPublicUrl(fileName)
  return data.publicUrl
}

/**
 * Vérifie si un jeu se qualifie dans le Top 5 du leaderboard du mois en cours.
 * Centralisé : remplace l'appel Supabase direct par FastAPI (api/routers/leaderboard_router.py).
 * @returns {boolean} true si le jeu est éligible
 */
export async function checkLeaderboardEligibility({ verdict, proba }) {
  try {
    const params = new URLSearchParams({ verdict, proba: String(proba) })
    const res = await fetch(`${API_URL}/api/leaderboard/eligible?${params}`)
    if (!res.ok) return false
    const { eligible } = await res.json()
    return eligible
  } catch (err) {
    console.error('[Leaderboard] Erreur eligibility check:', err)
    return false
  }
}

/**
 * Tente d'inscrire un jeu dans le leaderboard du mois en cours.
 * Centralisé : l'upload Storage reste en JS, les opérations DB passent par FastAPI.
 * @returns {boolean} true si le jeu a été inscrit, false sinon
 */
export async function saveToLeaderboard({ verdict, proba, metacritic_score, answers, coverBlob, creator_name = null, review_text = null, review_source = null }) {
  const gameName = answers.gameName?.trim() || 'Jeu sans nom'

  // Vérifie la qualification avant d'uploader l'image (évite un upload inutile)
  const eligible = await checkLeaderboardEligibility({ verdict, proba })
  if (!eligible) return false

  // Upload la jaquette uniquement si le jeu se qualifie (Supabase Storage)
  const coverUrl = await uploadCover(coverBlob, gameName)

  const entry = {
    verdict,
    proba,
    game_name:        gameName,
    genre:            answers.genre || null,
    universe:         answers.universe?.length > 0 ? answers.universe.join(', ') : null,
    game_mode:        answers.categories?.length > 0 ? answers.categories.join(', ') : null,
    core_mechanic:    answers.mechanics?.length > 0 ? answers.mechanics[0] : null,
    pricing:          answers.pricing !== null && answers.pricing !== undefined
                        ? (answers.pricing === 0 ? 'Gratuit' : `${answers.pricing}€`)
                        : null,
    metacritic_score: metacritic_score != null ? Math.round(metacritic_score) : null,
    cover_url:        coverUrl,
    creator_name:     creator_name || null,
    review_text:      review_text  || null,
    review_source:    review_source || null,
  }

  try {
    const res = await fetch(`${API_URL}/api/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    })
    if (!res.ok) {
      console.error('[Leaderboard] Erreur save:', await res.text())
      return false
    }
    const { saved } = await res.json()
    return saved
  } catch (err) {
    console.error('[Leaderboard] Erreur save:', err)
    return false
  }
}

/**
 * Récupère le leaderboard du mois en cours.
 * Centralisé : remplace les 2 appels Supabase directs par FastAPI.
 * @returns {{ success: GameCard[], flop: GameCard[] }}
 */
export async function fetchLeaderboard() {
  const res = await fetch(`${API_URL}/api/leaderboard`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
