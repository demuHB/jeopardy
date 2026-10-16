import { useEffect, useState } from 'react'
import type { MediaRef } from '../types'
import { loadMedia } from '../storage'

export function useMediaUrl(id: string | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!id) {
      setUrl(null)
      return
    }
    let objectUrl: string | null = null
    let cancelled = false
    loadMedia(id).then((blob) => {
      if (cancelled || !blob) return
      objectUrl = URL.createObjectURL(blob)
      setUrl(objectUrl)
    })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [id])
  return url
}

/** `fill`: Bild/Video passt sich in den verfügbaren Platz des Elternelements ein. */
export function MediaView({ media, compact = false, fill = false }: { media: MediaRef; compact?: boolean; fill?: boolean }) {
  const url = useMediaUrl(media.id)
  if (!url) return <div className="media-missing">Medium wird geladen …</div>
  const cls = compact ? 'media media-compact' : 'media'
  switch (media.kind) {
    case 'image': {
      const img = <img className={cls} src={url} alt={media.name ?? ''} />
      return fill ? <div className="media-fill">{img}</div> : img
    }
    case 'video': {
      const video = <video className={cls} src={url} controls playsInline />
      return fill ? <div className="media-fill">{video}</div> : video
    }
    case 'audio':
      return (
        <div className={`${cls} media-audio`}>
          <span className="audio-icon" aria-hidden>♪</span>
          <audio src={url} controls />
        </div>
      )
  }
}
