export default function PromiseSection() {
  return (
    <section className="w-full max-w-3xl mx-auto text-center" style={{ padding: '72px 48px' }}>
      <p
        className="font-space-mono text-muted-foreground leading-relaxed"
        style={{ fontSize: '1.1rem' }}
      >
        Vous avez une idée de jeu vidéo ?{' '}
        <span className="text-foreground font-semibold">Décrivez-la.</span>
        <br />
        On analyse des milliers de jeux réels pour vous dire si elle a une chance
        de{' '}
        <span className="text-primary font-semibold">réussir commercialement</span>.
      </p>
    </section>
  )
}
