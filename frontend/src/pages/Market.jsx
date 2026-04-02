/**
 * Analyse Catalogue /market
 * Dashboard analytique EDA alimenté par Supabase.
 */
import { useState } from 'react'
import { useTendances } from '../hooks/useTendances'
import { SentimentTab } from '../components/market/SentimentTab'
import KpiCard from '../components/market/KpiCard'
import MarketLoading from '../components/market/MarketLoading'
import ApercuTab from '../components/market/ApercuTab'
import DistributionsTab from '../components/market/DistributionsTab'
import SuccesTab from '../components/market/SuccesTab'

const TABS = [
  { id: 'apercu',        label: 'Vue d\'ensemble',     icon: 'dashboard' },
  { id: 'distributions', label: 'Distributions',        icon: 'bar_chart' },
  { id: 'succes',        label: 'Analyse par Tags',     icon: 'label' },
  { id: 'tags',          label: 'Analyse de sentiment', icon: 'psychology' },
]

const fmt = n => typeof n === 'number' ? n.toLocaleString('fr-FR') : n
// ════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ════════════════════════════════════════════════════════════════════
export default function Market() {
  const { data, loading, error } = useTendances()
  const [activeTab, setActiveTab] = useState('apercu')

  if (loading) return <MarketLoading />
  if (error) return (
    <div className="max-w-screen-2xl mx-auto px-6 py-24 text-center">
      <p className="font-space-grotesk text-xl font-bold text-destructive">Erreur : {error}</p>
    </div>
  )
  if (!data) return null

  const successPct = data.sampleSize > 0
    ? Math.round((data.successCount / (data.successCount + data.failCount)) * 100)
    : 0

  // ── Rendu principal ──────────────────────────────────────────────
  return (
    <div className="technical-grid min-h-full">
      <div className="max-w-screen-2xl mx-auto px-6 py-12">

        {/* ── Hero Header ── */}
        <section className="mb-10 pl-5" style={{ borderLeft: '3px solid var(--primary)' }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--primary)' }} />
            <span className="font-label text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
              EDA / Catalogue_Steam
            </span>
          </div>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <h1 className="font-headline font-black tracking-tighter text-foreground leading-none"
                style={{ fontSize: 'clamp(2rem, 7vw, 4.5rem)' }}
              >
                ANALYSE DU{' '}
                <span style={{ color: 'var(--primary)' }}>CATALOGUE</span>
              </h1>
              <p className="mt-3 font-inter text-sm text-muted-foreground max-w-2xl">
                EDA complet du catalogue Steam : Distributions, Pareto, corrélations et facteurs de succès,
                alimenté en temps réel depuis Supabase.
              </p>
            </div>
            <div className="shrink-0 flex flex-col gap-2 items-end">
              <div className="px-4 py-2 flex items-center gap-2"
                style={{ background: 'var(--card)', borderLeft: '4px solid var(--primary)' }}>
                <span className="material-symbols-outlined text-tertiary" style={{ fontSize: '18px' }}>database</span>
                <span className="font-inter text-[10px] font-bold uppercase tracking-tighter">
                  {fmt(data.totalGames)} jeux indexés
                </span>
              </div>
              <p className="font-inter text-[10px] text-muted-foreground uppercase tracking-widest">
                Échantillon : {fmt(data.sampleSize)} jeux analysés
              </p>
            </div>
          </div>
        </section>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <KpiCard
            label="Jeux dans la BDD"
            value={fmt(data.totalGames)}
            icon="sports_esports"
            color="var(--wif-pink)"
          />
          <KpiCard
            label="Genres uniques"
            value={data.uniqueGenres}
            icon="category"
            color="var(--wif-cyan)"
            sub={`${data.uniqueCategories} catégories Steam`}
          />
          <KpiCard
            label="Score Metacritic moyen"
            value={data.avgMetacritic > 0 ? data.avgMetacritic : '—'}
            icon="star"
            color="var(--wif-warn)"
            sub={`Médiane : ${data.medianMetacritic} / Couverture : ${data.pctWithMetacritic}%`}
          />
          <KpiCard
            label="Taux de succès"
            value={`${successPct}%`}
            icon="trending_up"
            color="var(--wif-success)"
            sub={`${fmt(data.successCount)} réussis / ${fmt(data.failCount)} échecs`}
          />
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 mb-8 border-b border-border/30 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 font-inter text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-200 border-b-2 -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div>
          {activeTab === 'apercu'        && <ApercuTab data={data} />}
          {activeTab === 'distributions' && <DistributionsTab data={data} successPct={successPct} />}
          {activeTab === 'succes'        && <SuccesTab successPct={successPct} />}
          {activeTab === 'tags'          && <SentimentTab />}
        </div>

      </div>
    </div>
  )
}
