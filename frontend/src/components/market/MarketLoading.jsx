export default function MarketLoading() {
  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-24 flex flex-col items-center gap-6">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="font-inter text-xs uppercase tracking-widest text-muted-foreground">
        Chargement des données Supabase…
      </p>
    </div>
  )
}
