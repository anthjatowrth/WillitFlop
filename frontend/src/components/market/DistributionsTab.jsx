import {
  BarChart, Bar,
  ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import Section from './Section'
import InsightBox from './InsightBox'
import StatBox from './StatBox'

const C = [
  '#E8005A', '#007A8C', '#00C8B4', '#4A90E2', '#007A4C',
  '#9B59B6', '#E67E22', '#1ABC9C', '#F39C12', '#CC1A1A',
  '#2ECC71', '#D35400', '#16A085', '#8E44AD', '#2980B9',
  '#E74C3C', '#3498DB', '#27AE60', '#F1C40F', '#E91E63',
]

const fmt    = n => typeof n === 'number' ? n.toLocaleString('fr-FR') : n
const fmtEur = n => `${parseFloat(n).toFixed(2)} €`

function rateColor(r) {
  if (r >= 50) return '#007A4C'
  if (r >= 35) return '#E67E22'
  return '#CC1A1A'
}

export default function DistributionsTab({ data, successPct }) {
  const paretoTotal = data.genreDistribution.reduce((s, g) => s + g.value, 0)
  let parCum = 0
  const allParetoData = data.genreDistribution.slice(0, 20).map(g => {
    parCum += g.value
    return {
      name: g.name.length > 14 ? g.name.slice(0, 14) + '…' : g.name,
      fullName: g.name,
      value: g.value,
      cumPct: parseFloat((parCum / paretoTotal * 100).toFixed(1)),
    }
  })
  const cutoffIdx  = allParetoData.findIndex(d => d.cumPct >= 80)
  const paretoData = allParetoData.slice(0, cutoffIdx >= 0 ? cutoffIdx + 3 : allParetoData.length)
  const genres80   = cutoffIdx + 1

  const priceSuccessMap = Object.fromEntries((data.priceSuccessRate || []).map(d => [d.name, d.successRate]))
  const priceData = data.priceDistribution.map(d => ({ ...d, successRate: priceSuccessMap[d.name] ?? null }))

  const metacSuccessMap = Object.fromEntries((data.metacSuccessRate || []).map(d => [d.name, d.successRate]))
  const metacData = data.metacriticDistribution.map(d => ({ ...d, successRate: metacSuccessMap[d.name] ?? null }))

  return (
    <div className="space-y-6">

      {/* ── Distribution des prix + Metacritic côte à côte ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <Section
          title="Distribution des prix"
          subtitle="Répartition par tranche tarifaire · taux de succès par tranche"
          badge={`μ = ${fmtEur(data.avgPricePaid)}  ·  Md = ${fmtEur(data.medianPricePaid)}`}
        >
          <ResponsiveContainer width="100%" height={230}>
            <ComposedChart data={priceData} margin={{ top: 10, right: 40, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--wif-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--wif-gray)' }} />
              <YAxis
                yAxisId="count"
                tick={{ fontSize: 11, fill: 'var(--wif-gray)' }}
                tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              />
              <YAxis
                yAxisId="rate"
                orientation="right"
                domain={[0, 100]}
                unit="%"
                tick={{ fontSize: 11, fill: '#007A4C' }}
              />
              <ReferenceLine
                yAxisId="rate" y={successPct}
                stroke="var(--wif-warn)" strokeDasharray="5 3"
                label={{ value: `${successPct}%`, position: 'insideTopRight', fontSize: 11, fill: 'var(--wif-warn)' }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const count = payload.find(p => p.dataKey === 'value')
                  const rate  = payload.find(p => p.dataKey === 'successRate')
                  return (
                    <div style={{ background: 'var(--wif-bg)', border: '1px solid var(--wif-border)' }}
                      className="px-4 py-3 shadow-2xl rounded-sm">
                      <p className="font-inter text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
                      {count && <p className="font-space-grotesk text-sm font-bold text-foreground">{fmt(count.value)} jeux</p>}
                      {rate?.value != null && (
                        <p className="font-space-grotesk text-sm font-bold" style={{ color: rateColor(rate.value) }}>
                          {rate.value}% succès
                        </p>
                      )}
                    </div>
                  )
                }}
              />
              <Bar yAxisId="count" dataKey="value" name="Jeux" radius={[4, 4, 0, 0]} maxBarSize={44}>
                {priceData.map((_, i) => (
                  <Cell key={i} fill={C[i % C.length]} fillOpacity={0.85} />
                ))}
              </Bar>
              <Line
                yAxisId="rate"
                type="monotone" dataKey="successRate"
                stroke="#007A4C" strokeWidth={2.5}
                dot={{ r: 4, fill: '#007A4C', stroke: 'var(--card)', strokeWidth: 2 }}
                activeDot={{ r: 7 }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-6 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: '#007A4C' }} />
              <span className="font-inter text-[10px] text-muted-foreground uppercase tracking-widest">% succès (axe droit)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded-sm shrink-0" style={{ backgroundColor: C[0], opacity: 0.85 }} />
              <span className="font-inter text-[10px] text-muted-foreground uppercase tracking-widest">Nb jeux (axe gauche)</span>
            </div>
          </div>
          <StatBox items={[
            { label: 'Moyenne',  value: fmtEur(data.avgPricePaid),    color: 'var(--wif-pink)' },
            { label: 'Médiane', value: fmtEur(data.medianPricePaid), color: 'var(--wif-cyan)' },
            { label: 'Gratuits', value: fmt(data.freePaid[0]?.value), color: 'var(--wif-gray)' },
            { label: 'Payants',  value: fmt(data.freePaid[1]?.value), color: 'var(--wif-gray)' },
          ]} />
        </Section>

        <Section
          title="Distribution Metacritic"
          subtitle="Notes critiques — jeux couverts par Metacritic · taux de succès par tranche"
          badge={`μ = ${data.avgMetacritic}  ·  Md = ${data.medianMetacritic}  ·  ${data.pctWithMetacritic}%`}
        >
          <ResponsiveContainer width="100%" height={230}>
            <ComposedChart data={metacData} margin={{ top: 10, right: 40, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--wif-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--wif-gray)' }} />
              <YAxis
                yAxisId="count"
                tick={{ fontSize: 11, fill: 'var(--wif-gray)' }}
                tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              />
              <YAxis
                yAxisId="rate"
                orientation="right"
                domain={[0, 100]}
                unit="%"
                tick={{ fontSize: 11, fill: '#4A90E2' }}
              />
              <ReferenceLine
                yAxisId="rate" y={successPct}
                stroke="var(--wif-warn)" strokeDasharray="5 3"
                label={{ value: `${successPct}%`, position: 'insideTopRight', fontSize: 11, fill: 'var(--wif-warn)' }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const count = payload.find(p => p.dataKey === 'value')
                  const rate  = payload.find(p => p.dataKey === 'successRate')
                  return (
                    <div style={{ background: 'var(--wif-bg)', border: '1px solid var(--wif-border)' }}
                      className="px-4 py-3 shadow-2xl rounded-sm">
                      <p className="font-inter text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
                      {count && <p className="font-space-grotesk text-sm font-bold text-foreground">{fmt(count.value)} jeux</p>}
                      {rate?.value != null && (
                        <p className="font-space-grotesk text-sm font-bold" style={{ color: rateColor(rate.value) }}>
                          {rate.value}% succès
                        </p>
                      )}
                    </div>
                  )
                }}
              />
              <Bar yAxisId="count" dataKey="value" name="Jeux" radius={[4, 4, 0, 0]} maxBarSize={44}>
                {metacData.map((_, i) => (
                  <Cell key={i} fill={C[i % C.length]} fillOpacity={0.85} />
                ))}
              </Bar>
              <Line
                yAxisId="rate"
                type="monotone" dataKey="successRate"
                stroke="#4A90E2" strokeWidth={2.5}
                dot={{ r: 4, fill: '#4A90E2', stroke: 'var(--card)', strokeWidth: 2 }}
                activeDot={{ r: 7 }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-6 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: '#4A90E2' }} />
              <span className="font-inter text-[10px] text-muted-foreground uppercase tracking-widest">% succès (axe droit)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded-sm shrink-0" style={{ backgroundColor: C[0], opacity: 0.85 }} />
              <span className="font-inter text-[10px] text-muted-foreground uppercase tracking-widest">Nb jeux (axe gauche)</span>
            </div>
          </div>
          <StatBox items={[
            { label: 'Score moyen',  value: data.avgMetacritic,           color: 'var(--wif-warn)' },
            { label: 'Score médian', value: data.medianMetacritic,        color: 'var(--wif-cyan)' },
            { label: 'Couverture',   value: `${data.pctWithMetacritic}%`, color: 'var(--wif-gray)' },
          ]} />
        </Section>

      </div>

      <InsightBox standalone icon="psychology_alt" title="Prix et qualité : deux variables qui comptent, mais pas comme on le croit">
        La distribution des prix révèle un marché profondément segmenté : une majorité de jeux gratuits ou très abordables, et un segment premium qui affiche de meilleures performances. Ce n'est pas vraiment la gratuité qui pénalise. C'est surtout qu'un prix bas s'accompagne souvent d'un positionnement flou et d'un lancement peu préparé. Côté Metacritic, la corrélation entre note critique et succès commercial existe, mais elle est limitée : moins de 10 % du catalogue est couvert par la presse. La grande majorité des jeux ne sera jamais testée par un journaliste. Pour 90 % du marché, ce sont les avis Steam des joueurs qui font foi. Soigner sa réputation auprès de sa communauté est bien plus porteur que de courir après une couverture presse.
      </InsightBox>

      {/* ── Playtime × succès + Achievements × succès ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <Section
          title="Durée de jeu (playtime)"
          subtitle="Distribution des jeux par durée médiane · lien avec le taux de succès"
          badge={`N = ${fmt(data.playtimeDistribution.reduce((s, d) => s + d.count, 0))}`}
        >
          <ResponsiveContainer width="100%" height={230}>
            <ComposedChart data={data.playtimeDistribution} margin={{ top: 10, right: 40, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--wif-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--wif-gray)' }} />
              <YAxis
                yAxisId="count"
                tick={{ fontSize: 11, fill: 'var(--wif-gray)' }}
                tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              />
              <YAxis
                yAxisId="rate"
                orientation="right"
                domain={[0, 100]}
                unit="%"
                tick={{ fontSize: 11, fill: '#007A8C' }}
              />
              <ReferenceLine
                yAxisId="rate" y={successPct}
                stroke="var(--wif-warn)" strokeDasharray="5 3"
                label={{ value: `${successPct}%`, position: 'insideTopRight', fontSize: 11, fill: 'var(--wif-warn)' }}
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
                      {count && <p className="font-space-grotesk text-sm font-bold text-foreground">{fmt(count.value)} jeux</p>}
                      {rate?.value != null && (
                        <p className="font-space-grotesk text-sm font-bold" style={{ color: rateColor(rate.value) }}>
                          {rate.value}% succès
                        </p>
                      )}
                    </div>
                  )
                }}
              />
              <Bar yAxisId="count" dataKey="count" name="Jeux" radius={[4, 4, 0, 0]} maxBarSize={44}>
                {data.playtimeDistribution.map((_, i) => (
                  <Cell key={i} fill={C[i % C.length]} fillOpacity={0.85} />
                ))}
              </Bar>
              <Line
                yAxisId="rate"
                type="monotone" dataKey="successRate"
                stroke="#007A8C" strokeWidth={2.5}
                dot={{ r: 4, fill: '#007A8C', stroke: 'var(--card)', strokeWidth: 2 }}
                activeDot={{ r: 7 }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-6 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: '#007A8C' }} />
              <span className="font-inter text-[10px] text-muted-foreground uppercase tracking-widest">% succès (axe droit)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded-sm shrink-0" style={{ backgroundColor: C[0], opacity: 0.85 }} />
              <span className="font-inter text-[10px] text-muted-foreground uppercase tracking-widest">Nb jeux (axe gauche)</span>
            </div>
          </div>
        </Section>

        <Section
          title="Taux de débloquage des succès"
          subtitle="Médiane d'unlock rate par tranche · lien avec le taux de succès"
          badge={`N = ${fmt(data.achievementDistribution.reduce((s, d) => s + d.count, 0))}`}
        >
          <ResponsiveContainer width="100%" height={230}>
            <ComposedChart data={data.achievementDistribution} margin={{ top: 10, right: 40, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--wif-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--wif-gray)' }} />
              <YAxis
                yAxisId="count"
                tick={{ fontSize: 11, fill: 'var(--wif-gray)' }}
                tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              />
              <YAxis
                yAxisId="rate"
                orientation="right"
                domain={[0, 100]}
                unit="%"
                tick={{ fontSize: 11, fill: '#9B59B6' }}
              />
              <ReferenceLine
                yAxisId="rate" y={successPct}
                stroke="var(--wif-warn)" strokeDasharray="5 3"
                label={{ value: `${successPct}%`, position: 'insideTopRight', fontSize: 11, fill: 'var(--wif-warn)' }}
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
                      {count && <p className="font-space-grotesk text-sm font-bold text-foreground">{fmt(count.value)} jeux</p>}
                      {rate?.value != null && (
                        <p className="font-space-grotesk text-sm font-bold" style={{ color: rateColor(rate.value) }}>
                          {rate.value}% succès
                        </p>
                      )}
                    </div>
                  )
                }}
              />
              <Bar yAxisId="count" dataKey="count" name="Jeux" radius={[4, 4, 0, 0]} maxBarSize={44}>
                {data.achievementDistribution.map((_, i) => (
                  <Cell key={i} fill={C[(i + 4) % C.length]} fillOpacity={0.85} />
                ))}
              </Bar>
              <Line
                yAxisId="rate"
                type="monotone" dataKey="successRate"
                stroke="#9B59B6" strokeWidth={2.5}
                dot={{ r: 4, fill: '#9B59B6', stroke: 'var(--card)', strokeWidth: 2 }}
                activeDot={{ r: 7 }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-6 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: '#9B59B6' }} />
              <span className="font-inter text-[10px] text-muted-foreground uppercase tracking-widest">% succès (axe droit)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded-sm shrink-0" style={{ backgroundColor: C[4], opacity: 0.85 }} />
              <span className="font-inter text-[10px] text-muted-foreground uppercase tracking-widest">Nb jeux (axe gauche)</span>
            </div>
          </div>
        </Section>

      </div>

      <InsightBox standalone icon="hourglass_bottom" title="Durée et progression : l'engagement comme moteur de réputation">
        Les jeux avec une durée de jeu intermédiaire affichent en général les meilleurs taux de succès. Cette "zone idéale" correspond à une expérience assez longue pour générer des avis positifs et des recommandations spontanées, sans pour autant exiger un engagement qui décourage l'achat impulsif. Les systèmes de succès (achievements) jouent un rôle similaire : ils structurent l'expérience, créent des objectifs secondaires et prolongent la durée de vie perçue du jeu. Un système de succès bien pensé n'est pas un gadget. C'est un outil de rétention qui signale à l'algorithme Steam une base de joueurs active, ce qui améliore directement la visibilité dans les recommandations.
      </InsightBox>

      {/* ── Pareto genres ── */}
      <Section
        title="Analyse de Pareto — Répartition des genres"
        subtitle={`Principe 80/20 : ${genres80} genres concentrent 80% des publications Steam`}
        badge="Pareto 80/20"
      >
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={paretoData} margin={{ top: 10, right: 60, left: 10, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--wif-border)" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: 'var(--wif-gray)', angle: -35, textAnchor: 'end' }}
              height={60}
            />
            <YAxis
              yAxisId="count"
              tick={{ fontSize: 12, fill: 'var(--wif-gray)' }}
              tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
            />
            <YAxis
              yAxisId="pct"
              orientation="right"
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: 'var(--wif-cyan)' }}
              unit="%"
            />
            <ReferenceLine
              yAxisId="pct" y={80}
              stroke="var(--wif-warn)" strokeDasharray="5 3"
              label={{ value: '80 %', position: 'insideTopRight', fontSize: 12, fill: 'var(--wif-warn)' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0]?.payload
                return (
                  <div style={{ background: 'var(--wif-bg)', border: '1px solid var(--wif-border)' }}
                    className="px-4 py-3 shadow-2xl rounded-sm">
                    <p className="font-inter text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                      {d?.fullName}
                    </p>
                    <p className="font-space-grotesk text-sm font-bold text-foreground">{fmt(d?.value)} jeux</p>
                    <p className="font-space-grotesk text-sm" style={{ color: 'var(--wif-cyan)' }}>
                      Cumulé : {d?.cumPct}%
                    </p>
                  </div>
                )
              }}
            />
            <Bar yAxisId="count" dataKey="value" name="Jeux" radius={[3, 3, 0, 0]}>
              {paretoData.map((d, i) => (
                <Cell key={i} fill={d.cumPct <= 80 ? '#E8005A' : '#888'} fillOpacity={0.8} />
              ))}
            </Bar>
            <Line
              yAxisId="pct"
              type="monotone"
              dataKey="cumPct"
              name="% cumulé"
              stroke="var(--wif-cyan)"
              strokeWidth={2}
              dot={{ r: 3, fill: 'var(--wif-cyan)' }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-6 mt-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: '#E8005A' }} />
            <span className="font-inter text-sm text-muted-foreground">Genres dans le top 80%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: '#888' }} />
            <span className="font-inter text-sm text-muted-foreground">Longue traîne</span>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: 'var(--wif-cyan)' }} />
            <span className="font-inter text-sm text-muted-foreground">% cumulé (axe droit)</span>
          </div>
        </div>
        <InsightBox icon="bar_chart_4_bars" title="La loi de Pareto est impitoyable sur Steam">
          Quelques genres, typiquement Indie, Action, Adventure et RPG, accaparent l'écrasante majorité des publications. Ce n'est pas un hasard : ces catégories bénéficient d'une demande forte et d'une barrière à l'entrée relativement faible, ce qui attire les développeurs. Le problème est structurel : plus un genre est populaire, plus la concurrence y est féroce, et plus il est difficile d'émerger sans un budget marketing significatif. La longue traîne, ces genres grisés avec moins de publications, offre paradoxalement des niches à fort potentiel, où la demande existe mais l'offre reste insuffisante. Identifier ces zones sous-exploitées est souvent plus stratégique que d'attaquer les genres leaders avec un dixième du budget d'un studio établi.
        </InsightBox>
      </Section>

    </div>
  )
}
