import { successGames } from '../../data/leaderboard'
import GameRankCard from './GameRankCard'

export default function SuccessLeaderboard() {
  return (
    <div className="flex flex-col gap-4">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-2">
        <span
          className="material-symbols-outlined"
          style={{ fontSize: '22px', color: 'var(--primary)' }}
        >
          rocket_launch
        </span>
        <h2 className="font-headline text-lg font-extrabold tracking-tight text-foreground">
          Top 5 Success Stories
        </h2>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3">
        {successGames.map((game) => (
          <GameRankCard key={game.rank} variant="success" {...game} />
        ))}
      </div>
    </div>
  )
}
