import { useRef, useState } from 'react'
import type { Content } from '../types'
import { deleteMedia, saveMedia } from '../storage'
import { mediaKindFromMime, uid } from '../util'
import { MediaView } from './MediaView'

interface Props {
  label: string
  value: Content
  onChange: (c: Content) => void
  placeholder?: string
}

/** Text plus optionales Bild/Video/Audio für Frage oder Antwort. */
export function ContentEditor({ label, value, onChange, placeholder }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  async function pick(file: File) {
    const kind = mediaKindFromMime(file.type)
    if (!kind) {
      setError('Nur Bilder, Videos oder Audiodateien.')
      return
    }
    setError(null)
    const id = uid()
    await saveMedia(id, file)
    if (value.media) await deleteMedia(value.media.id)
    onChange({ ...value, media: { kind, id, name: file.name } })
  }

  async function remove() {
    if (value.media) await deleteMedia(value.media.id)
    onChange({ text: value.text })
  }

  return (
    <div className="content-editor">
      <label className="field-label">{label}</label>
      <textarea
        value={value.text}
        placeholder={placeholder}
        rows={3}
        onChange={(e) => onChange({ ...value, text: e.target.value })}
      />
      <div className="media-row">
        {value.media ? (
          <>
            <div className="media-preview">
              <MediaView media={value.media} compact />
            </div>
            <div className="media-actions">
              <span className="media-name">{value.media.name}</span>
              <button type="button" onClick={() => fileRef.current?.click()}>
                Ersetzen
              </button>
              <button type="button" className="danger" onClick={remove}>
                Entfernen
              </button>
            </div>
          </>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()}>
            + Bild / Video / Musik
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*,audio/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void pick(f)
            e.target.value = ''
          }}
        />
      </div>
      {error && <div className="error">{error}</div>}
    </div>
  )
}
