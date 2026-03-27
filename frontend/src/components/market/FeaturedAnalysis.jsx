/**
 * FeaturedAnalysis — asymmetric 2-col section (image left + text right)
 * Colors via CSS variables only.
 */
import { featuredAnalysis } from '../../data/marketStats'

export default function FeaturedAnalysis() {
  const { caseNumber, headline, label, title, body, ctaLabel, imageUrl } = featuredAnalysis

  return (
    <section className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
      {/* Left — image with overlay badge */}
      <div className="relative">
        {/* Decorative accent block */}
        <div
          className="absolute -top-4 -left-4 w-24 h-24 -z-10"
          style={{ backgroundColor: 'var(--wif-pink)', opacity: 0.1 }}
        />
        <img
          src={imageUrl}
          alt="High-tech gaming data visualization"
          className="w-full grayscale hover:grayscale-0 transition-all duration-500 rounded-sm shadow-2xl"
        />
        {/* Badge overlay */}
        <div className="absolute bottom-6 right-6 bg-primary p-4 text-primary-foreground">
          <div className="font-inter text-[10px] uppercase font-bold">
            Intelligence Case {caseNumber}
          </div>
          <div className="font-space-grotesk text-lg font-bold italic tracking-tighter">
            {headline}
          </div>
        </div>
      </div>

      {/* Right — editorial text */}
      <div className="md:pl-12">
        <span className="font-inter text-xs tracking-widest uppercase text-tertiary font-bold mb-4 block">
          {label}
        </span>
        <h2 className="font-space-grotesk text-4xl font-bold tracking-tight mb-6 text-foreground">
          {title}
        </h2>
        <p className="font-manrope text-muted-foreground leading-relaxed mb-8">{body}</p>

        <button className="flex items-center gap-4 group">
          <span className="font-inter font-bold uppercase tracking-widest text-primary text-sm">
            {ctaLabel}
          </span>
          <span
            className="material-symbols-outlined text-primary group-hover:translate-x-2 transition-transform"
          >
            arrow_right_alt
          </span>
        </button>
      </div>
    </section>
  )
}
