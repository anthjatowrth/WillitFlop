import { flopGames } from '../../data/leaderboard'
import GameRankCard from './GameRankCard'

export default function FlopLeaderboard() {
  return (
    <div className="flex flex-col gap-4">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-2">
        <span
          className="material-symbols-outlined"
          style={{ fontSize: '22px', color: 'var(--tertiary)' }}
        >
          heart_broken
        </span>
        <h2 className="font-headline text-lg font-extrabold tracking-tight text-foreground">
          Flop 5 Hall of Shame
        </h2>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3">
        {flopGames.map((game) => (
          <GameRankCard key={game.rank} variant="flop" {...game} />
        ))}
      </div>
    </div>
  )
}
