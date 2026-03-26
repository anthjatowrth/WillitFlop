export default function SkeletonGrid() {
  return Array.from({ length: 8 }).map((_, i) => (
    <div key={i} className="bg-surface-container-high animate-pulse" style={{ aspectRatio: '3/4' }} />
  ))
}
