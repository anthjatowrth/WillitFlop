export default function Footer() {
    return (
      <footer className="w-full flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-[#EEECE6]">
        {/* Logo */}
        <div className="text-xs font-bold tracking-widest uppercase">
          <span className="text-black">WILL</span>
          <span className="text-primary">I</span>
          <span className="text-black">T</span>
          <span className="text-primary">FLOP</span>
        </div>
  
        {/* Credits */}
        <p className="text-xs text-gray-400 font-mono tracking-wide">
          Explorer · Bootcamp Data Analyst 2026 · Anthony &amp; Pierre
        </p>
      </footer>
    );
  }