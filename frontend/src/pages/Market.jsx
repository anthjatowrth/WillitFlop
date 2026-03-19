import { useState, useEffect } from 'react'
import { supabase } from '../api/client'
import CardGame from '../components/CardGame'

export default function Market() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!supabase) {
      setError({ message: 'Supabase client non configuré' })
      setLoading(false)
      return
    }
    const fetchData = async () => {
      const { data: games, error } = await supabase.from('games').select('*').order('name', { ascending: true })
      if (error) {
        setError(error)
      } else {
        setData(games)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  if (error) {
    return <div>Error: {error.message}</div>
  }
  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Market</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map(game => (
          <CardGame key={game.id} game={game} />
        ))}
      </div>
    </div>
  )
}