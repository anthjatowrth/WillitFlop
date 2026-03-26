import { useState } from 'react'
import Lightbox from './Lightbox'
import SectionLabel from './SectionLabel'

export default function ScreenshotCarousel({ urls }) {
  const [index, setIndex] = useState(0)
  const [lightbox, setLightbox] = useState(null)
  if (!urls?.length) return null

  const prev = () => setIndex((i) => (i - 1 + urls.length) % urls.length)
  const next = () => setIndex((i) => (i + 1) % urls.length)

  return (
    <>
      {lightbox && <Lightbox url={lightbox} onClose={() => setLightbox(null)} />}
      <section>
        <SectionLabel>Captures d'écran</SectionLabel>
        <div className="flex flex-col gap-3">
          <div
            className="relative overflow-hidden border border-border group cursor-zoom-in"
            style={{ aspectRatio: '16/9' }}
            onClick={() => setLightbox(urls[index])}
          >
            <img
              src={urls[index]}
              alt={`Screenshot ${index + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
              <span className="material-symbols-outlined text-white" style={{ fontSize: '32px' }}>zoom_in</span>
            </div>
            <button
              aria-label="Screenshot précédente"
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 focus-visible:bg-black/80 text-white transition-colors p-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/60"
              onClick={(e) => { e.stopPropagation(); prev() }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_left</span>
            </button>
            <button
              aria-label="Screenshot suivante"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 focus-visible:bg-black/80 text-white transition-colors p-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/60"
              onClick={(e) => { e.stopPropagation(); next() }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_right</span>
            </button>
            <div className="absolute bottom-2 right-3 bg-black/60 px-2 py-0.5 font-label text-[10px] tracking-wider text-white/80">
              {index + 1} / {urls.length}
            </div>
          </div>

          {/* Dot pagination — enlarged touch target, hover + focus states */}
          <div className="flex gap-1.5 justify-center">
            {urls.map((_, i) => (
              <button
                key={i}
                aria-label={`Screenshot ${i + 1}`}
                className="p-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm"
                onClick={() => setIndex(i)}
              >
                <span
                  className="block w-1.5 h-1.5 transition-all duration-200 rounded-full"
                  style={{
                    background: i === index ? 'var(--primary)' : 'var(--border)',
                    opacity: i === index ? 1 : 0.6,
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
