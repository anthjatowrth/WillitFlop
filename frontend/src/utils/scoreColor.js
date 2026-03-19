/**
 * Returns a CSS variable name suffix for the Metacritic score accent colour,
 * or null when no score is available (score is null / 0).
 *
 * Possible return values: 'tertiary' | 'primary' | 'outline-variant' | null
 */
export function getScoreAccent(score) {
  if (score == null || score === 0) return null
  if (score >= 85) return 'tertiary'
  if (score >= 70) return 'primary'
  return 'outline-variant'
}
