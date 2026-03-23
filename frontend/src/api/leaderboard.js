import { supabase } from './client'

/** Retourne la période courante au format 'YYYY-MM' */
function getCurrentPeriod() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Upload un blob image dans Supabase Storage (bucket 'game-covers').
 * Retourne l'URL publique permanente, ou null en cas d'échec.
 */
async function uploadCover(blob, gameName) {
  if (!blob) return null

  // Nom de fichier unique basé sur le timestamp
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
 * Vérifie si un jeu se qualifie dans le Top 5 du leaderboard du mois en cours,
 * sans rien insérer en base.
 * @returns {boolean} true si le jeu est éligible
 */
export async function checkLeaderboardEligibility({ verdict, proba }) {
  const period = getCurrentPeriod()
  const ascending = verdict === 'Top!'

  const { data: existing, error } = await supabase
    .from('leaderboard_entries')
    .select('id, proba')
    .eq('period', period)
    .eq('verdict', verdict)
    .order('proba', { ascending })
    .limit(5)

  if (error) {
    console.error('[Leaderboard] Erreur fetch eligibility:', error)
    return false
  }

  if (existing.length < 5) return true

  const worst = existing[0]
  return verdict === 'Top!'
    ? proba > worst.proba
    : proba < worst.proba
}

/**
 * Tente d'inscrire un jeu dans le leaderboard du mois en cours.
 * N'insère que si le jeu se qualifie dans le Top 5 de sa catégorie.
 * Si le top 5 est plein, remplace l'entrée la moins bonne.
 *
 * @param {Blob|null} coverBlob    - Le blob image retourné par Pollinations
 * @param {string|null} creator_name - Pseudo saisi par l'utilisateur
 * @returns {boolean} true si le jeu a été inscrit, false sinon
 */
export async function saveToLeaderboard({ verdict, proba, metacritic_score, answers, coverBlob, creator_name = null, review_text = null, review_source = null }) {
  const period = getCurrentPeriod()
  const gameName = answers.gameName?.trim() || 'Jeu sans nom'

  // Récupère le top 5 actuel trié du "moins bon" au "meilleur"
  // Pour Top! : on veut en premier le plus bas proba (le plus faible succès)
  // Pour Flop!: on veut en premier le plus haut proba (le moins flopped)
  const ascending = verdict === 'Top!'
  const { data: existing, error: fetchError } = await supabase
    .from('leaderboard_entries')
    .select('id, proba')
    .eq('period', period)
    .eq('verdict', verdict)
    .order('proba', { ascending })
    .limit(5)

  if (fetchError) {
    console.error('[Leaderboard] Erreur fetch:', fetchError)
    return false
  }

  // Vérifie si le jeu se qualifie avant d'uploader l'image
  if (existing.length >= 5) {
    const worst = existing[0]
    const qualifies = verdict === 'Top!'
      ? proba > worst.proba
      : proba < worst.proba
    if (!qualifies) return false
  }

  // Upload la jaquette uniquement si le jeu se qualifie
  const coverUrl = await uploadCover(coverBlob, gameName)

  const entry = {
    period,
    verdict,
    game_name:        gameName,
    genre:            answers.genre || null,
    universe:         answers.universe?.length > 0 ? answers.universe.join(', ') : null,
    game_mode:        answers.categories?.length > 0 ? answers.categories.join(', ') : null,
    core_mechanic:    answers.mechanics?.length > 0 ? answers.mechanics[0] : null,
    visual_style:     null,
    playtime:         null,
    platforms:        null,
    pricing:          answers.pricing !== null && answers.pricing !== undefined
                        ? (answers.pricing === 0 ? 'Gratuit' : `${answers.pricing}€`)
                        : null,
    proba,
    metacritic_score: metacritic_score != null ? Math.round(metacritic_score) : null,
    cover_url:        coverUrl,
    creator_name:     creator_name || null,
    review_text:      review_text  || null,
    review_source:    review_source || null,
  }

  // Moins de 5 entrées → on insère directement
  if (existing.length < 5) {
    const { error } = await supabase.from('leaderboard_entries').insert(entry)
    if (error) { console.error('[Leaderboard] Erreur insert:', error); return false }
    return true
  }

  // Remplace le pire par le nouveau
  const { error: delError } = await supabase
    .from('leaderboard_entries')
    .delete()
    .eq('id', existing[0].id)

  if (delError) { console.error('[Leaderboard] Erreur delete:', delError); return false }

  const { error: insError } = await supabase.from('leaderboard_entries').insert(entry)
  if (insError) { console.error('[Leaderboard] Erreur insert:', insError); return false }

  return true
}

/**
 * Récupère le leaderboard du mois en cours.
 * @returns {{ success: GameCard[], flop: GameCard[] }}
 */
export async function fetchLeaderboard() {
  const period = getCurrentPeriod()

  const [successRes, flopRes] = await Promise.all([
    supabase
      .from('leaderboard_entries')
      .select('*')
      .eq('period', period)
      .eq('verdict', 'Top!')
      .order('proba', { ascending: false })
      .limit(5),
    supabase
      .from('leaderboard_entries')
      .select('*')
      .eq('period', period)
      .eq('verdict', 'Flop!')
      .order('proba', { ascending: true })
      .limit(5),
  ])

  if (successRes.error) throw successRes.error
  if (flopRes.error) throw flopRes.error

  return {
    success: successRes.data.map(entryToCard),
    flop:    flopRes.data.map(entryToCard),
  }
}

/** Transforme une entrée DB en format attendu par GameRankCard */
function entryToCard(entry, index) {
  const rank = index + 1
  const subtitleParts = [entry.genre, entry.universe].filter(Boolean)
  const tags = [entry.game_mode, entry.core_mechanic].filter(Boolean)
  const score = entry.metacritic_score ?? Math.round((entry.proba ?? 0) * 100)

  return {
    rank,
    title:    entry.game_name,
    subtitle: subtitleParts.length > 0 ? subtitleParts.join(' · ') : null,
    score,
    image:    entry.cover_url ?? null,
    tags:     tags.length > 0 ? tags : undefined,
    creator:  entry.creator_name ?? null,
    // Extra fields for the hover detail panel
    proba:         entry.proba ?? null,
    pricing:       entry.pricing ?? null,
    verdict:       entry.verdict ?? null,
    genre:         entry.genre ?? null,
    universe:      entry.universe ?? null,
    metacritic:    entry.metacritic_score ?? null,
    review_text:   entry.review_text   ?? null,
    review_source: entry.review_source ?? null,
  }
}
