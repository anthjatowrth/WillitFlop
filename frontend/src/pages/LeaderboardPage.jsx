import { useState, useEffect } from 'react'
import SuccessLeaderboard from '../components/leaderboard/SuccessLeaderboard'
import FlopLeaderboard    from '../components/leaderboard/FlopLeaderboard'
import LeaderboardCTA     from '../components/leaderboard/LeaderboardCTA'
import { fetchLeaderboard } from '../api/leaderboard'

export default function LeaderboardPage() {
  const [successGames, setSuccessGames] = useState([])
  const [flopGames, setFlopGames]       = useState([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    fetchLeaderboard()
      .then(({ success, flop }) => {
        setSuccessGames(success)
        setFlopGames(flop)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="technical-grid min-h-full">
      <div className="max-w-screen-2xl mx-auto px-6 py-12">

        {/* ── Section 1 — Hero Header ──────────────────────────────── */}
        <section
          className="mb-14 pl-5"
          style={{ borderLeft: '3px solid var(--primary)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: 'var(--primary)' }}
            />
            <span className="font-label text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
              Reset mensuel : 1er de chaque mois
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <h1 className="font-headline font-black tracking-tighter text-7xl text-foreground leading-none">
                CLASSEMENT{' '}
                <span style={{ color: 'var(--primary)' }}>DE VOS CRÉATIONS</span>
              </h1>
              <p className="mt-3 font-inter text-sm text-muted-foreground max-w-2xl">
                Notre algorithme analyse plus de 16 000 jeux indépendants publiés sur Steam pour prédire leur succès.
                Retrouvez ici les titres qui ont le mieux performé et ceux qui ont le plus déçu les attentes : la preuve par
                l'exemple de notre modèle prédictif.
              </p>
            </div>

            {/* Accuracy badge */}
            <div
              className="shrink-0 px-6 py-4"
              style={{
                background: 'var(--card)',
                borderLeft: '4px solid var(--primary)',
                boxShadow:  '0 2px 16px rgba(0,0,0,0.06)',
              }}
            >
              <span className="font-label text-[10px] tracking-[0.25em] uppercase text-muted-foreground block mb-1">
                Précision algorithme :
              </span>
              <span
                className="font-headline text-2xl font-black tracking-tight"
                style={{ color: 'var(--primary)' }}
              >
                84.2%
              </span>
            </div>
          </div>
        </section>

        {/* ── Section 2 — Bento Grid ───────────────────────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-4">
          <SuccessLeaderboard games={successGames} loading={loading} />
          <FlopLeaderboard    games={flopGames}    loading={loading} />
        </section>
      </div>

      {/* ── Section 3 — CTA Callout (full-width) ────────────────── */}
      <LeaderboardCTA />
    </div>
  )
}
