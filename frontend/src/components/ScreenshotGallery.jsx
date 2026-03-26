import { useState } from 'react'
import Lightbox from './Lightbox'
import SectionLabel from './SectionLabel'

export default function ScreenshotGallery({ urls }) {
  const [active, setActive] = useState(urls?.[0] ?? null)
  const [lightbox, setLightbox] = useState(null)
  if (!urls?.length) return null

  return (
    <>
      {lightbox && <Lightbox url={lightbox} onClose={() => setLightbox(null)} />}
      <section>
        <SectionLabel>Captures d'écran</SectionLabel>
        <div className="flex flex-col gap-3">
          <div
            className="overflow-hidden border border-border cursor-zoom-in relative group"
            style={{ aspectRatio: '16/9' }}
            onClick={() => setLightbox(active)}
          >
            <img
              src={active}
              alt="Screenshot"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
              <span className="material-symbols-outlined text-white" style={{ fontSize: '32px' }}>zoom_in</span>
            </div>
          </div>
          <div className="flex gap-2">
            {urls.map((url, i) => (
              <button
                key={url}
                className="overflow-hidden border transition-all duration-200 flex-1"
                style={{
                  aspectRatio: '16/9',
                  borderColor: active === url ? 'var(--primary)' : 'var(--border)',
                }}
                onClick={() => setActive(url)}
              >
                <img
                  src={url}
                  alt={`Screenshot ${i + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
