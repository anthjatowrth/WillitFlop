import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <header className="w-full flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-background">
      {/* Logo */}
      <div className="text-sm font-bold tracking-widest uppercase">
        <span className="text-black">WILL</span>
        <span className="text-primary">I</span>
        <span className="text-black">T</span>
        <span className="text-primary">FLOP</span>
      </div>

      {/* Nav actions */}
      <nav className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          className="rounded-none border border-black text-black text-xs tracking-widest uppercase font-mono hover:bg-black hover:text-white transition-colors"
        >
          DATA EXPLORER
        </Button>
        <Button
          size="sm"
          className="rounded-none bg-primary text-white text-xs tracking-widest uppercase font-mono hover:bg-primary/80 transition-colors"
        >
          Étude complète →
        </Button>
        <a
          href="#"
          className="text-xs text-black tracking-widest uppercase font-mono hover:underline"
        >
          → Accueil
        </a>
      </nav>
    </header>
  );
}