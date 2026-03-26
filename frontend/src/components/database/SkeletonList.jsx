export default function SkeletonList() {
  return Array.from({ length: 8 }).map((_, i) => (
    <div key={i} className="h-16 bg-surface-container-high animate-pulse" />
  ))
}
