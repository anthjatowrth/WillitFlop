import { useState, useEffect } from 'react'

// Centralisé : remplace les 5 appels Supabase directs (full scans games,
// game_genres, game_categories, game_tags + count) par un seul appel FastAPI.
// L'agrégation est désormais faite côté serveur Python (api/routers/analytics.py).

const API_URL = import.meta.env.VITE_API_URL

export function useTendances() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const res = await fetch(`${API_URL}/api/market/tendances`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return { data, loading, error }
}
