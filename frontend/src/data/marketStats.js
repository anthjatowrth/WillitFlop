/**
 * All hardcoded data for the MarketStats dashboard.
 * No inline data in components — import from here.
 */

export const marketGrowthData = [
  { month: 'JAN', predicted: 62, actual: 55 },
  { month: 'MAR', predicted: 71, actual: 62 },
  { month: 'MAY', predicted: 80, actual: 74 },
  { month: 'JUL', predicted: 77, actual: 68 },
  { month: 'SEP', predicted: 88, actual: 79 },
  { month: 'NOV', predicted: 93, actual: 83 },
]

/** fill uses CSS variables so colors stay in sync with index.css tokens */
export const genreData = [
  { name: 'Roguelike Deckbuilder', share: 34, fill: 'var(--wif-pink)',  labelColor: 'var(--wif-pink)'  },
  { name: 'Cosy Farming Sim',      share: 28, fill: 'var(--wif-cyan)',  labelColor: 'var(--wif-cyan)'  },
  { name: 'Retro FPS',             share: 19, fill: 'var(--wif-gray)',  labelColor: 'var(--wif-gray)'  },
  { name: 'Horror Narrative',      share: 12, fill: 'var(--wif-ink2)', labelColor: 'var(--wif-ink2)' },
]

/**
 * variant: 'primary' | 'tertiary' | 'secondary'
 * Component maps variant → tailwind classes (static strings — no purge issues).
 */
export const tacticalAlerts = [
  {
    id: 1,
    variant: 'primary',
    icon: 'warning',
    title: 'Oversaturation Alert: Survivors-like',
    body: 'Market volume for "horde survival" games has reached critical mass. Expect higher CAC.',
    muted: false,
  },
  {
    id: 2,
    variant: 'tertiary',
    icon: 'trending_up',
    title: 'Emerging Trend: Procedural Co-op',
    body: 'Search volume for co-op procedural generation games up 45% this quarter.',
    muted: false,
  },
  {
    id: 3,
    variant: 'secondary',
    icon: 'info',
    title: 'Platform Shift: Epic Store Growth',
    body: 'Indie conversions on Epic Store showing steady +4% growth.',
    muted: true,
  },
]

export const featuredAnalysis = {
  caseNumber: '#402',
  headline: 'THE ROGUELIKE BUBBLE',
  label: 'In-Depth Editorial',
  title: "Why Roguelikes Continue to Dominate Steam's Top 100",
  body: "Our analysis shows that \"replayability velocity\" is the single highest predictor of an indie game's long-term revenue tail. We've mapped over 2,000 titles to identify the specific mechanical hooks that drive procedural longevity.",
  ctaLabel: 'Read Full Intelligence Report',
  imageUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCQX81M7QiG3y3JLRBXRqOGIeZZSZ5eLOX_vc9M8A_fJ8ryFMpxIM-tmq8GT5q7Zj77wQJAqFNjBnWwYQ2AoqIkNbV4eIVGlKWkkKOyCSvEdsgLOTeOelOxMo_yp4CgPJvTgpdyck3mcBOwwY646gSZKI0i9zMp8peVD4KfAopW87lXpT9PokE-nbVMRiUSCyTCa_BExuHG5gmdzKsnyeVINKfeHz09WPeCwYn6xgXC4qmQ3ZYDqZGVTfAJcIG55Y1pdwClsLTSjz0',
}
