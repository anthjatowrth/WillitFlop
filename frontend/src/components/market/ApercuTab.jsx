import {
  Area,
  BarChart, Bar,
  ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import Section from './Section'
import InsightBox from './InsightBox'

const fmt = n => typeof n === 'number' ? n.toLocaleString('fr-FR') : n

export default function ApercuTab({ data }) {
  return (
    <div className="space-y-6">

      {/* ── Timeline jeux/année ── */}
      <Section
        title="Volume de publications par année (2010–2025)"
        subtitle="Tendance à long terme de l'offre Steam, évolution du taux de succès"
        badge={`N = ${fmt(data.sampleSize)}`}
      >
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={data.gamesPerYear} margin={{ top: 10, right: 55, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradYear" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#E8005A" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#E8005A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--wif-border)" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--wif-gray)' }} />
            <YAxis
              yAxisId="count"
              tick={{ fontSize: 10, fill: 'var(--wif-gray)' }}
              tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
            />
            <YAxis
              yAxisId="rate"
              orientation="right"
              domain={[0, 100]}
              unit="%"
              tick={{ fontSize: 10, fill: '#007A4C' }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                const count = payload.find(p => p.dataKey === 'count')
                const rate  = payload.find(p => p.dataKey === 'successRate')
                return (
                  <div style={{ background: 'var(--wif-bg)', border: '1px solid var(--wif-border)' }}
                    className="px-4 py-3 shadow-2xl rounded-sm">
                    <p className="font-inter text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
                    {count && (
                      <p className="font-space-grotesk text-sm font-bold" style={{ color: 'var(--wif-pink)' }}>
                        {fmt(count.value)} jeux publiés
                      </p>
                    )}
                    {rate?.value != null && (
                      <p className="font-space-grotesk text-sm font-bold" style={{ color: 'var(--wif-success)' }}>
                        {rate.value}% de succès
                      </p>
                    )}
                  </div>
                )
              }}
            />
            <Area
              yAxisId="count"
              type="monotone" dataKey="count" name="Jeux"
              stroke="#E8005A" strokeWidth={2.5}
              fill="url(#gradYear)"
              dot={{ r: 3, fill: '#E8005A' }}
              activeDot={{ r: 6, fill: '#E8005A' }}
            />
            <Line
              yAxisId="rate"
              type="monotone" dataKey="successRate" name="Taux de succès"
              stroke="#007A4C" strokeWidth={2.5}
              dot={{ r: 4, fill: '#007A4C', stroke: 'var(--card)', strokeWidth: 1.5 }}
              activeDot={{ r: 7, fill: '#007A4C' }}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-6 mt-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: 'var(--wif-pink)' }} />
            <span className="font-inter text-[10px] text-muted-foreground uppercase tracking-widest">Jeux publiés (axe gauche)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: 'var(--wif-success)' }} />
            <span className="font-inter text-[10px] text-muted-foreground uppercase tracking-widest">Taux de succès % (axe droit)</span>
          </div>
        </div>
        <InsightBox icon="show_chart" title="Une offre qui a explosé, une visibilité qui s'est effondrée">
          Entre 2010 et aujourd'hui, le nombre de jeux publiés sur Steam a été multiplié par plus de 30. Cette croissance traduit avant tout la démocratisation des outils de développement et une politique de publication de plus en plus ouverte. Résultat : le taux de succès moyen s'est érodé au fil des années, à mesure que la concurrence s'est intensifiée. Pour un jeu indépendant lancé aujourd'hui, les chances d'être découvert sans stratégie marketing active sont infimes. La qualité ne suffit plus : la visibilité est devenue la ressource la plus précieuse de l'écosystème Steam.
        </InsightBox>
      </Section>

      {/* ── Saisonnalité — publications & succès par mois ── */}
      {(() => {
        const seasonColors = [
          '#4A90E2', '#6BAED6',
          '#74C476', '#41AB5D', '#238B45',
          '#FEC44F', '#FE9929', '#EC7014',
          '#E74C3C', '#C0392B', '#9B59B6',
          '#2980B9',
        ]
        const avgMonthCount = data.releaseByMonth.length > 0
          ? Math.round(data.releaseByMonth.reduce((s, m) => s + m.count, 0) / 12)
          : 0
        const topMonth = [...data.releaseByMonth].sort((a, b) => b.count - a.count)[0]

        return (
          <Section
            title="Saisonnalité des sorties — Jan à Déc"
            subtitle="Volume de publications et taux de succès agrégés sur toutes les années (2010–2025)"
            badge={`Moy. mensuelle : ${fmt(avgMonthCount)} jeux`}
          >
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={data.releaseByMonth} margin={{ top: 10, right: 55, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSeason" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"  stopColor="#E8005A" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#E8005A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--wif-border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--wif-gray)' }} />
                <YAxis
                  yAxisId="count"
                  tick={{ fontSize: 10, fill: 'var(--wif-gray)' }}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                />
                <YAxis
                  yAxisId="rate"
                  orientation="right"
                  domain={[0, 60]}
                  unit="%"
                  tick={{ fontSize: 10, fill: '#007A4C' }}
                />
                <ReferenceLine
                  yAxisId="count" y={avgMonthCount}
                  stroke="var(--wif-border)" strokeDasharray="5 3"
                  label={{ value: 'Moy.', position: 'insideTopRight', fontSize: 9, fill: 'var(--wif-gray)' }}
                />
                <Tooltip
                  cursor={{ fill: 'var(--wif-border)', fillOpacity: 0.2 }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const count = payload.find(p => p.dataKey === 'count')
                    const rate  = payload.find(p => p.dataKey === 'successRate')
                    return (
                      <div style={{ background: 'var(--wif-bg)', border: '1px solid var(--wif-border)' }}
                        className="px-4 py-3 shadow-2xl rounded-sm">
                        <p className="font-inter text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
                        {count && (
                          <p className="font-space-grotesk text-sm font-bold text-foreground">
                            {fmt(count.value)} jeux publiés
                          </p>
                        )}
                        {rate?.value != null && (
                          <p className="font-space-grotesk text-sm font-bold" style={{ color: 'var(--wif-success)' }}>
                            {rate.value}% de succès
                          </p>
                        )}
                      </div>
                    )
                  }}
                />
                <Bar yAxisId="count" dataKey="count" name="Publications" radius={[4, 4, 0, 0]} maxBarSize={44}>
                  {data.releaseByMonth.map((_, i) => (
                    <Cell key={i} fill={seasonColors[i]} fillOpacity={0.85} />
                  ))}
                </Bar>
                <Line
                  yAxisId="rate"
                  type="monotone" dataKey="successRate" name="Taux de succès"
                  stroke="#007A4C" strokeWidth={2.5}
                  dot={{ r: 5, fill: '#007A4C', stroke: 'var(--card)', strokeWidth: 2 }}
                  activeDot={{ r: 8, fill: '#007A4C' }}
                  connectNulls={false}
                />
              </ComposedChart>
            </ResponsiveContainer>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-3">
              {[
                { label: 'Hiver', color: '#4A90E2' },
                { label: 'Printemps', color: '#41AB5D' },
                { label: 'Été', color: '#FE9929' },
                { label: 'Automne', color: '#E74C3C' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="font-inter text-[10px] text-muted-foreground uppercase tracking-widest">{s.label}</span>
                </div>
              ))}
              {topMonth && (
                <span className="ml-auto font-inter text-[10px] text-muted-foreground/60">
                  Mois le plus chargé : <strong className="text-foreground">{topMonth.month}</strong> ({fmt(topMonth.count)} jeux)
                </span>
              )}
              <div className="w-full flex items-center gap-2 mt-1">
                <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: 'var(--wif-success)' }} />
                <span className="font-inter text-[10px] text-muted-foreground uppercase tracking-widest">Taux de succès % (axe droit)</span>
              </div>
            </div>
            <InsightBox icon="calendar_month" title="Le calendrier de sortie, un levier souvent sous-estimé">
              Il y a un paradoxe bien documenté dans les données : les mois les plus chargés en sorties, souvent avant les grandes fêtes, sont aussi ceux où la concurrence pour l'attention des joueurs est la plus forte. Sortir "avec la masse" dilue la visibilité sur les storefronts et dans les algorithmes de recommandation. Les périodes creuses, elles, offrent moins de concurrence directe et peuvent améliorer le taux de découverte à budget identique. La vraie question n'est pas toujours "quand est-ce que beaucoup de joueurs achètent ?" mais "quand est-ce que mon jeu aura le moins de rivaux directs pour capter l'attention ?"
            </InsightBox>
          </Section>
        )
      })()}

      {/* ── Twitch Live Snapshot ── */}
      <Section
        title="Présence Twitch du catalogue"
        subtitle="Viewers & streams actifs au dernier snapshot — données live actualisées en continu"
        badge={data.twitchFetchedAt ? `Snapshot ${data.twitchFetchedAt}` : 'Live'}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            {
              label: 'Jeux sur Twitch',
              value: `${data.twitchCoverage}%`,
              sub: `${fmt(data.twitchCount)} jeux représentés`,
              color: '#9B59B6',
            },
            {
              label: 'Viewers live',
              value: fmt(data.twitchTotalViewers),
              sub: 'spectateurs au snapshot',
              color: '#E8005A',
            },
            {
              label: 'Succès Twitch vs sans',
              value: `+${data.twitchSuccessRate - data.nonTwitchSuccessRate}pts`,
              sub: `${data.twitchSuccessRate}% vs ${data.nonTwitchSuccessRate}%`,
              color: '#007A4C',
            },
          ].map((k, i) => (
            <div key={i} className="bg-background/50 border border-border/20 p-4"
              style={{ borderLeft: `3px solid ${k.color}` }}>
              <p className="font-inter text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{k.label}</p>
              <p className="font-space-grotesk text-2xl font-bold leading-none" style={{ color: k.color }}>{k.value}</p>
              <p className="font-inter text-xs text-muted-foreground mt-1">{k.sub}</p>
            </div>
          ))}
        </div>

        {data.twitchByGenre.length > 0 ? (
          <>
            <p className="font-inter text-xs text-muted-foreground mb-3 uppercase tracking-widest">
              Top genres — viewers Twitch cumulés
            </p>
            <ResponsiveContainer width="100%" height={data.twitchByGenre.length * 38 + 20}>
              <BarChart
                data={data.twitchByGenre}
                layout="vertical"
                margin={{ top: 0, right: 60, left: 8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gradTwitch" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%"   stopColor="#9B59B6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#E8005A" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--wif-border)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12, fill: 'var(--wif-gray)' }}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fontSize: 12, fill: 'var(--wif-gray)' }}
                />
                <Tooltip
                  cursor={{ fill: 'var(--wif-border)', fillOpacity: 0.15 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0]?.payload
                    return (
                      <div style={{ background: 'var(--wif-bg)', border: '2px solid #9B59B6' }}
                        className="px-4 py-3 shadow-2xl rounded-sm min-w-40">
                        <p className="font-inter text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: '#9B59B6' }}>
                          {d?.name}
                        </p>
                        <p className="font-space-grotesk text-base font-bold text-foreground">
                          {fmt(d?.viewers)} viewers
                        </p>
                        <p className="font-inter text-xs text-muted-foreground">{fmt(d?.games)} jeux</p>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="viewers" name="Viewers" fill="url(#gradTwitch)" radius={[0, 4, 4, 0]}>
                  {data.twitchByGenre.map((_, i) => (
                    <Cell key={i} fill="url(#gradTwitch)" fillOpacity={1 - i * 0.06} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        ) : (
          <p className="font-inter text-sm text-muted-foreground text-center py-8">Aucune donnée Twitch disponible</p>
        )}
        <InsightBox icon="live_tv" title="Le streaming, signal de marché autant que canal de visibilité">
          L'écart de taux de succès entre les jeux présents sur Twitch et les autres est frappant. Attention cependant : le streaming ne "crée" pas le succès. Ce qu'il révèle, c'est que les jeux capables de générer du contenu streamable ont souvent des qualités communes : forte rejouabilité, moments spectaculaires, dynamique sociale. Twitch est à la fois un canal de distribution et un indicateur de conception. Un jeu difficile à streamer est souvent un jeu difficile à faire découvrir par le bouche-à-oreille numérique, qui reste le principal vecteur de croissance organique sur Steam. Penser à des moments "clipables" dès la conception du jeu, ce n'est pas du cynisme. C'est de la stratégie.
        </InsightBox>
      </Section>

    </div>
  )
}
