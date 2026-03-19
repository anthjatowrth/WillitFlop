import { useState, useEffect } from 'react'
import { supabase } from '../api/client'

export function useTendances() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchAll() {
      try {
        setLoading(true)

        // Parallel fetches pour les performances
        const [
          { count: totalGames },
          { data: gamesRaw },
          { data: genreRaw },
          { data: categoryRaw },
          { data: tagRaw },
        ] = await Promise.all([
          supabase.from('games').select('*', { count: 'exact', head: true }),
          supabase
            .from('games')
            .select('app_id, name, release_date, is_free, is_successful, metacritic_score, price_eur, owners_midpoint, review_wilson_score, header_image, review_total_positive, review_total')
            .order('review_wilson_score', { ascending: false })
            .limit(10000),
          supabase.from('game_genres').select('app_id, genre_name').limit(50000),
          supabase.from('game_categories').select('category_name').limit(50000),
          supabase.from('game_tags').select('tag_name, votes').limit(50000),
        ])

        // ── Genre distribution ───────────────────────────────────
        const genreCountsMap = {}
        genreRaw?.forEach(({ genre_name }) => {
          genreCountsMap[genre_name] = (genreCountsMap[genre_name] || 0) + 1
        })
        const genreDistribution = Object.entries(genreCountsMap)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)

        // ── Genre success rates (join côté client) ───────────────
        const successMap = new Map()
        gamesRaw?.forEach(g => {
          if (g.is_successful !== null && g.is_successful !== undefined) {
            successMap.set(g.app_id, g.is_successful)
          }
        })
        const genreSuccessAccum = {}
        genreRaw?.forEach(({ app_id, genre_name }) => {
          const isSuccessful = successMap.get(app_id)
          if (isSuccessful !== undefined) {
            if (!genreSuccessAccum[genre_name]) {
              genreSuccessAccum[genre_name] = { total: 0, success: 0 }
            }
            genreSuccessAccum[genre_name].total++
            if (isSuccessful) genreSuccessAccum[genre_name].success++
          }
        })
        const genreSuccessRate = Object.entries(genreSuccessAccum)
          .filter(([, { total }]) => total >= 5)
          .map(([name, { total, success }]) => ({
            name: name.length > 18 ? name.slice(0, 18) + '…' : name,
            fullName: name,
            successRate: Math.round((success / total) * 100),
            total,
          }))
          .sort((a, b) => b.successRate - a.successRate)
          .slice(0, 12)

        // ── Category distribution ────────────────────────────────
        const categoryCountsMap = {}
        categoryRaw?.forEach(({ category_name }) => {
          categoryCountsMap[category_name] = (categoryCountsMap[category_name] || 0) + 1
        })
        const categoryDistribution = Object.entries(categoryCountsMap)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 15)

        // ── Tag votes ────────────────────────────────────────────
        const tagVotesMap = {}
        tagRaw?.forEach(({ tag_name, votes }) => {
          tagVotesMap[tag_name] = (tagVotesMap[tag_name] || 0) + (votes || 0)
        })
        const tagDistribution = Object.entries(tagVotesMap)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 30)

        // ── Jeux par année ───────────────────────────────────────
        const yearMap = {}
        gamesRaw?.forEach(g => {
          if (g.release_date) {
            const year = new Date(g.release_date).getFullYear()
            if (year >= 2010 && year <= 2025) {
              yearMap[year] = (yearMap[year] || 0) + 1
            }
          }
        })
        const gamesPerYear = Object.entries(yearMap)
          .map(([year, count]) => ({ year: year.toString(), count }))
          .sort((a, b) => parseInt(a.year) - parseInt(b.year))

        // ── Gratuit vs Payant ────────────────────────────────────
        let freeCount = 0, paidCount = 0
        gamesRaw?.forEach(g => { g.is_free ? freeCount++ : paidCount++ })
        const freePaid = [
          { name: 'Gratuits', value: freeCount },
          { name: 'Payants', value: paidCount },
        ]

        // ── Distribution Succès ──────────────────────────────────
        let successCount = 0, failCount = 0, unknownCount = 0
        gamesRaw?.forEach(g => {
          if (g.is_successful === true) successCount++
          else if (g.is_successful === false) failCount++
          else unknownCount++
        })
        const successDistribution = [
          { name: 'Réussis', value: successCount, color: '#007A4C' },
          { name: 'Échecs', value: failCount, color: '#E8005A' },
        ]

        // ── Score Metacritic moyen ───────────────────────────────
        const withScore = gamesRaw?.filter(g => g.metacritic_score > 0) || []
        const avgMetacritic = withScore.length > 0
          ? Math.round(withScore.reduce((s, g) => s + g.metacritic_score, 0) / withScore.length)
          : 0

        // ── Distribution des prix ────────────────────────────────
        const priceBuckets = {
          'Gratuit': 0, '< 5€': 0, '5–10€': 0, '10–20€': 0, '20–30€': 0, '> 30€': 0,
        }
        gamesRaw?.forEach(g => {
          if (g.is_free || g.price_eur === 0) priceBuckets['Gratuit']++
          else if (g.price_eur < 5) priceBuckets['< 5€']++
          else if (g.price_eur < 10) priceBuckets['5–10€']++
          else if (g.price_eur < 20) priceBuckets['10–20€']++
          else if (g.price_eur < 30) priceBuckets['20–30€']++
          else priceBuckets['> 30€']++
        })
        const priceDistribution = Object.entries(priceBuckets).map(([name, value]) => ({ name, value }))

        // ── Distribution Metacritic ──────────────────────────────
        const metacBuckets = {
          '< 50': 0, '50–59': 0, '60–69': 0, '70–79': 0, '80–89': 0, '90+': 0,
        }
        withScore.forEach(g => {
          const s = g.metacritic_score
          if (s < 50) metacBuckets['< 50']++
          else if (s < 60) metacBuckets['50–59']++
          else if (s < 70) metacBuckets['60–69']++
          else if (s < 80) metacBuckets['70–79']++
          else if (s < 90) metacBuckets['80–89']++
          else metacBuckets['90+']++
        })
        const metacriticDistribution = Object.entries(metacBuckets).map(([name, value]) => ({ name, value }))

        // ── Succès par tranche de prix ───────────────────────────
        const priceSuccessBuckets = {
          'Gratuit': { total: 0, success: 0 },
          '< 5€': { total: 0, success: 0 },
          '5–10€': { total: 0, success: 0 },
          '10–20€': { total: 0, success: 0 },
          '> 20€': { total: 0, success: 0 },
        }
        gamesRaw?.forEach(g => {
          if (g.is_successful === null || g.is_successful === undefined) return
          let bucket
          if (g.is_free || g.price_eur === 0) bucket = 'Gratuit'
          else if (g.price_eur < 5) bucket = '< 5€'
          else if (g.price_eur < 10) bucket = '5–10€'
          else if (g.price_eur < 20) bucket = '10–20€'
          else bucket = '> 20€'
          priceSuccessBuckets[bucket].total++
          if (g.is_successful) priceSuccessBuckets[bucket].success++
        })
        const priceSuccessRate = Object.entries(priceSuccessBuckets)
          .filter(([, { total }]) => total > 0)
          .map(([name, { total, success }]) => ({
            name,
            successRate: Math.round((success / total) * 100),
            total,
          }))

        // ── Top jeux ─────────────────────────────────────────────
        const topGames = (gamesRaw || [])
          .filter(g => g.review_wilson_score > 0 && g.name)
          .slice(0, 25)

        // ── Taux de succès par score Metacritic ──────────────────
        const metacSuccessBuckets = {
          '< 60': { total: 0, success: 0 },
          '60–69': { total: 0, success: 0 },
          '70–79': { total: 0, success: 0 },
          '80–89': { total: 0, success: 0 },
          '90+': { total: 0, success: 0 },
        }
        gamesRaw?.forEach(g => {
          if (g.is_successful === null || !g.metacritic_score) return
          const s = g.metacritic_score
          let bucket
          if (s < 60) bucket = '< 60'
          else if (s < 70) bucket = '60–69'
          else if (s < 80) bucket = '70–79'
          else if (s < 90) bucket = '80–89'
          else bucket = '90+'
          metacSuccessBuckets[bucket].total++
          if (g.is_successful) metacSuccessBuckets[bucket].success++
        })
        const metacSuccessRate = Object.entries(metacSuccessBuckets)
          .filter(([, { total }]) => total > 0)
          .map(([name, { total, success }]) => ({
            name,
            successRate: Math.round((success / total) * 100),
            total,
          }))

        setData({
          totalGames: totalGames || 0,
          genreDistribution: genreDistribution.slice(0, 20),
          genreTreemap: genreDistribution.slice(0, 25).map(g => ({ name: g.name, size: g.value })),
          categoryDistribution,
          tagDistribution,
          gamesPerYear,
          freePaid,
          successDistribution,
          successCount,
          failCount,
          avgMetacritic,
          genreSuccessRate,
          topGames,
          priceDistribution,
          metacriticDistribution,
          priceSuccessRate,
          metacSuccessRate,
          sampleSize: gamesRaw?.length || 0,
          uniqueGenres: Object.keys(genreCountsMap).length,
          uniqueCategories: Object.keys(categoryCountsMap).length,
        })
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [])

  return { data, loading, error }
}
