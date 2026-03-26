import { useState, useEffect, useCallback } from 'react'

/**
 * Custom hook for fetching paginated game data.
 * Centralisé : remplace l'appel Supabase direct par un appel FastAPI.
 *
 * - genre / year / search / playMode filters are applied server-side
 * - pagination uses page + pageSize — never fetches the entire table
 *
 * @param {{ page: number, pageSize: number, genre: string, year: string, search: string, playMode: string }}
 * @returns {{ games: object[], totalCount: number, loading: boolean, error: Error|null, refetch: Function }}
 */

const API_URL = import.meta.env.VITE_API_URL

export function useGameDatabase({ page = 1, pageSize = 80, genre = '', year = '', search = '', playMode = '', letterFilter = '', sortBy = 'alpha' }) {
  const [rawGames, setRawGames] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchGames = useCallback(async () => {
    setLoading(true)
    setError(null)

    // Construction de l'URL avec les mêmes paramètres qu'avant (alias camelCase via query params)
    const params = new URLSearchParams({
      page:         String(page),
      pageSize:     String(pageSize),
      sortBy,
    })
    if (genre)        params.set('genre',        genre)
    if (year)         params.set('year',          year)
    if (search.trim()) params.set('search',       search.trim())
    if (playMode)     params.set('playMode',      playMode)
    if (letterFilter) params.set('letterFilter',  letterFilter)

    try {
      const res = await fetch(`${API_URL}/api/games?${params}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `HTTP ${res.status}`)
      }
      const { data, count } = await res.json()
      setRawGames(data ?? [])
      setTotalCount(count ?? 0)
    } catch (err) {
      setError(err)
      setRawGames([])
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, genre, year, search, playMode, letterFilter, sortBy])

  useEffect(() => {
    fetchGames()
  }, [fetchGames])

  return { games: rawGames, totalCount, loading, error, refetch: fetchGames }
}
