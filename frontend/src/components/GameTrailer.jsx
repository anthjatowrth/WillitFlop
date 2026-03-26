import { useRef, useEffect } from 'react'
import Hls from 'hls.js'
import SectionLabel from './SectionLabel'

export default function GameTrailer({ hlsUrl, posterUrl }) {
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !hlsUrl) return

    const isHls = hlsUrl.includes('.m3u8')

    if (isHls && Hls.isSupported()) {
      const hls = new Hls()
      hls.loadSource(hlsUrl)
      hls.attachMedia(video)
      return () => hls.destroy()
    } else if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl
    } else {
      video.src = hlsUrl
    }
  }, [hlsUrl])

  if (!hlsUrl) return null

  return (
    <section>
      <SectionLabel>Trailer</SectionLabel>
      <div className="overflow-hidden border border-border group" style={{ aspectRatio: '16/9' }}>
        <video
          ref={videoRef}
          poster={posterUrl}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          onMouseEnter={(e) => e.currentTarget.setAttribute('controls', '')}
          onMouseLeave={(e) => e.currentTarget.removeAttribute('controls')}
          onFocus={(e) => e.currentTarget.setAttribute('controls', '')}
          onBlur={(e) => e.currentTarget.removeAttribute('controls')}
        />
      </div>
    </section>
  )
}
