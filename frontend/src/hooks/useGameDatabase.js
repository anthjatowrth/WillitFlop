import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../api/client'

/**
 * Custom hook for fetching paginated game data from Supabase.
 *
 * - genre / year / search / playMode filters are applied server-side
 * - pagination uses .range() — never fetches the entire table
 *
 * @param {{ page: number, pageSize: number, genre: string, year: string, search: string, playMode: string }}
 * @returns {{ games: object[], totalCount: number, loading: boolean, error: Error|null, refetch: Function }}
 */
export function useGameDatabase({ page = 1, pageSize = 80, genre = '', year = '', search = '', playMode = '', letterFilter = '', sortBy = 'alpha' }) {
  const [rawGames, setRawGames] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchGames = useCallback(async () => {
    setLoading(true)
    setError(null)

    const from = (page - 1) * pageSize
    const to   = from + pageSize - 1

    // Use inner join only when actively filtering on the related table
    const genreJoin    = genre    ? 'game_genres!inner(genre_name)'       : 'game_genres(genre_name)'
    const categoryJoin = playMode ? 'game_categories!inner(category_name)' : 'game_categories(category_name)'
    const cols = `app_id,name,metacritic_score,header_image,release_date,fetched_at,is_successful,${genreJoin},${categoryJoin}`

    const order =
      sortBy === 'owners'     ? { col: 'owners_midpoint',  asc: false } :
      sortBy === 'metacritic' ? { col: 'metacritic_score', asc: false } :
                                { col: 'name',             asc: true  }

    let query = supabase
      .from('games')
      .select(cols, { count: 'exact' })
      .order(order.col, { ascending: order.asc, nullsFirst: false })
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

    if (playMode) {
      if (playMode === 'solo') {
        query = query.ilike('game_categories.category_name', 'single-player')
      } else if (playMode === 'multi') {
        query = query.ilike('game_categories.category_name', 'multi-player')
      } else if (playMode === 'coop') {
        query = query.ilike('game_categories.category_name', '%co-op%')
      }
    }

    if (letterFilter) {
      if (letterFilter === '#') {
        query = query.or('name.ilike.0%,name.ilike.1%,name.ilike.2%,name.ilike.3%,name.ilike.4%,name.ilike.5%,name.ilike.6%,name.ilike.7%,name.ilike.8%,name.ilike.9%')
      } else {
        query = query.ilike('name', `${letterFilter}%`)
      }
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
  }, [page, pageSize, genre, year, search, playMode, letterFilter, sortBy])

  useEffect(() => {
    fetchGames()
  }, [fetchGames])

  return { games: rawGames, totalCount, loading, error, refetch: fetchGames }
}
