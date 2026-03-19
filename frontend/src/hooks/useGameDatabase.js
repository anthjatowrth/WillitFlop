import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../api/client'

/**
 * Custom hook for fetching paginated game data from Supabase.
 *
 * - genre / year / search filters are applied server-side
 * - pagination uses .range() — never fetches the entire table
 *
 * @param {{ page: number, pageSize: number, genre: string, year: string, search: string }}
 * @returns {{ games: object[], totalCount: number, loading: boolean, error: Error|null, refetch: Function }}
 */
export function useGameDatabase({ page = 1, pageSize = 12, genre = '', year = '', search = '' }) {
  const [rawGames, setRawGames] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchGames = useCallback(async () => {
    setLoading(true)
    setError(null)

    const from = (page - 1) * pageSize
    const to   = from + pageSize - 1

    // Use inner join only when filtering by genre so we don't exclude
    // games that have no genre rows when no filter is active.
    const cols = genre
      ? 'app_id,name,metacritic_score,header_image,release_date,fetched_at,game_genres!inner(genre_name)'
      : 'app_id,name,metacritic_score,header_image,release_date,fetched_at,game_genres(genre_name)'

    let query = supabase
      .from('games')
      .select(cols, { count: 'exact' })
      .order('metacritic_score', { ascending: false })
      .range(from, to)

    if (genre) {
      query = query.eq('game_genres.genre_name', genre)
    }

    if (year) {
      query = query
        .gte('release_date', `${year}-01-01`)
        .lte('release_date', `${year}-12-31`)
    }

    if (search.trim()) {
      query = query.ilike('name', `%${search.trim()}%`)
    }

    const { data, count, error: queryError } = await query

    if (queryError) {
      setError(queryError)
      setRawGames([])
    } else {
      setRawGames(data ?? [])
      setTotalCount(count ?? 0)
    }

    setLoading(false)
  }, [page, pageSize, genre, year, search])

  useEffect(() => {
    fetchGames()
  }, [fetchGames])

  return { games: rawGames, totalCount, loading, error, refetch: fetchGames }
}
