export default function Logo({ className = 'text-sm' }) {
  return (
    <div className={`font-orbitron font-bold tracking-widest uppercase ${className}`}>
      <span style={{ color: 'var(--wif-ink)' }}>WILL</span>
      <span style={{ color: 'var(--wif-pink)' }}>IT</span>
      <span style={{ color: 'var(--wif-ink)' }}>FLOP</span>
    </div>
  )
}
