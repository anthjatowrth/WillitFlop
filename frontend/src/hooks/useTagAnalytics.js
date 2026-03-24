import { useState, useEffect } from 'react'
import { supabase } from '../api/client'

// ── Tags exacts issus du mapping MiniGame → payload ML ───────────────
const AMBIANCE_TAGS = [
  'Dark', 'Mature', 'Cozy', 'Wholesome', 'Sci-fi', 'Futuristic',
  'Fantasy', 'Medieval', 'Cyberpunk', 'Steampunk', 'Post-apocalyptic',
  'Comedy', 'Parody', 'Horror', 'Psychological', 'Historical', 'Anime',
]
const GAMEPLAY_TAGS = [
  'Rogue-like', 'Rogue-lite', 'Open World', 'Story Rich', 'Narrative',
  'Crafting', 'Survival', 'Turn-Based', 'Turn-Based Strategy',
  'Fast-Paced', 'Puzzle', 'Deckbuilding', 'Card Game',
  'Souls-like', 'Difficult', 'Sandbox', 'Tower Defense', 'Metroidvania',
  'Resource Management', 'Action RPG', 'Logic',
]
const VISUAL_TAGS = [
  'Pixel Graphics', '2D', '3D', 'Retro', 'Colorful',
  'Cartoon', 'Realistic', 'Low-poly', 'Hand-drawn', 'Minimalist',
]
const CAMERA_TAGS = [
  'First-Person', 'FPS', 'Third-Person', 'Isometric',
  'Side Scroller', '2D Platformer', 'Top-Down', 'Point & Click',
]
const ALL_TRACKED = [
  ...new Set([...AMBIANCE_TAGS, ...GAMEPLAY_TAGS, ...VISUAL_TAGS, ...CAMERA_TAGS]),
]

// ── Pagination : récupère TOUS les enregistrements d'une table ────────
// Récupère le count d'abord, puis toutes les pages en parallèle
async function fetchAll(table, select, filters = {}, pageSize = 1000) {
  let countQ = supabase.from(table).select(select, { count: 'exact', head: true })
  if (filters.in) countQ = countQ.in(filters.in[0], filters.in[1])
  const { count, error: countErr } = await countQ
  if (countErr) throw countErr
  if (!count) return []

  const results = await Promise.all(
    Array.from({ length: Math.ceil(count / pageSize) }, (_, i) => {
      let q = supabase.from(table).select(select).range(i * pageSize, (i + 1) * pageSize - 1)
      if (filters.in) q = q.in(filters.in[0], filters.in[1])
      return q
    })
  )
  for (const r of results) if (r.error) throw r.error
  return results.flatMap(r => r.data || [])
}

// ── Calcul volume + taux de succès ────────────────────────────────────
function computeStats(rows, successMap, minCount = 20) {
  const acc = {}
  rows.forEach(({ app_id, name }) => {
    if (!acc[name]) acc[name] = { total: 0, success: 0 }
    acc[name].total++
    if (successMap.get(app_id) === true) acc[name].success++
  })
  return Object.entries(acc)
    .filter(([, s]) => s.total >= minCount)
    .map(([name, s]) => ({
      name: name.length > 22 ? name.slice(0, 22) + '…' : name,
      fullName: name,
      count: s.total,
      successRate: Math.round((s.success / s.total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
}

// ── Hook principal ────────────────────────────────────────────────────
export function useTagAnalytics() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    async function run() {
      try {
        setLoading(true)

        // Fetch complet — pagination automatique
        const [gamesRaw, tagsRaw, genresRaw, catsRaw] = await Promise.all([
          fetchAll('games',            'app_id, is_successful'),
          fetchAll('game_tags',        'app_id, tag_name',
            { in: ['tag_name', ALL_TRACKED] }),
          fetchAll('game_genres',      'app_id, genre_name'),
          fetchAll('game_categories',  'app_id, category_name'),
        ])

        // Map app_id → is_successful
        const successMap = new Map()
        gamesRaw.forEach(g => {
          if (g.is_successful !== null && g.is_successful !== undefined)
            successMap.set(g.app_id, g.is_successful)
        })

        const genre    = computeStats(genresRaw.map(r => ({ app_id: r.app_id, name: r.genre_name })),     successMap).slice(0, 12)
        const ambiance = computeStats(tagsRaw.filter(t => AMBIANCE_TAGS.includes(t.tag_name)).map(t => ({ app_id: t.app_id, name: t.tag_name })), successMap).slice(0, 14)
        const gameplay = computeStats(tagsRaw.filter(t => GAMEPLAY_TAGS.includes(t.tag_name)).map(t => ({ app_id: t.app_id, name: t.tag_name })), successMap).slice(0, 14)
        const visual   = computeStats(tagsRaw.filter(t => VISUAL_TAGS.includes(t.tag_name)).map(t => ({ app_id: t.app_id, name: t.tag_name })),   successMap).slice(0, 10)
        const camera   = computeStats(tagsRaw.filter(t => CAMERA_TAGS.includes(t.tag_name)).map(t => ({ app_id: t.app_id, name: t.tag_name })),   successMap).slice(0, 8)
        const playmode = computeStats(catsRaw.map(r => ({ app_id: r.app_id, name: r.category_name })),   successMap).slice(0, 10)

        setData({ sampleSize: gamesRaw.length, genre, ambiance, gameplay, visual, camera, playmode })
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  return { data, loading, error }
}
