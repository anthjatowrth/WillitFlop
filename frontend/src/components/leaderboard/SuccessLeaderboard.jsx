import GameRankCard from './GameRankCard'

export default function SuccessLeaderboard({ games, loading }) {
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
        {loading && <LeaderboardSkeleton />}

        {!loading && games.length === 0 && (
          <EmptyState
            icon="rocket_launch"
            message="Aucun jeu inscrit ce mois-ci. Sois le premier !"
          />
        )}

        {!loading && games.map((game) => (
          <GameRankCard key={game.rank} variant="success" panelSide="right" {...game} />
        ))}
      </div>
    </div>
  )
}

function LeaderboardSkeleton() {
  return Array.from({ length: 5 }).map((_, i) => (
    <div
      key={i}
      className="h-16 rounded bg-card animate-pulse"
      style={{ opacity: 1 - i * 0.15 }}
    />
  ))
}

function EmptyState({ icon, message }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-12 rounded"
      style={{ background: 'var(--card)', border: '1px dashed var(--border)' }}
    >
      <span
        className="material-symbols-outlined opacity-20"
        style={{ fontSize: '40px', color: 'var(--foreground)' }}
      >
        {icon}
      </span>
      <p className="font-label text-[10px] tracking-[0.2em] uppercase text-muted-foreground text-center px-4">
        {message}
      </p>
    </div>
  )
}
