/** Logo component — extracted verbatim from Navbar.jsx. Do not restyle. */
export default function Logo({ className = 'text-sm' }) {
  return (
    <div className={`font-bold tracking-widest uppercase ${className}`}>
      <span className="text-black">WILL</span>
      <span className="text-primary">I</span>
      <span className="text-black">T</span>
      <span className="text-primary">FLOP</span>
    </div>
  )
}
