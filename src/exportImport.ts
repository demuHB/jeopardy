import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import type { Game } from './types'
import { loadMedia, saveGame, saveMedia } from './storage'
import { mediaIds, uid } from './util'

interface Manifest {
  format: 'jeopardy-game'
  version: 1
  game: Game
  media: Record<string, string> // id -> MIME-Typ
}

export async function exportGame(game: Game): Promise<Blob> {
  const files: Record<string, Uint8Array> = {}
  const media: Record<string, string> = {}
  for (const id of mediaIds(game)) {
    const blob = await loadMedia(id)
    if (!blob) continue
    files[`media/${id}`] = new Uint8Array(await blob.arrayBuffer())
    media[id] = blob.type
  }
  const manifest: Manifest = { format: 'jeopardy-game', version: 1, game, media }
  files['game.json'] = strToU8(JSON.stringify(manifest, null, 2))
  // Medien sind meist schon komprimiert, daher nur speichern (level 0).
  const zipped = zipSync(files, { level: 0 })
  return new Blob([zipped as BlobPart], { type: 'application/zip' })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const safeFilename = (s: string) =>
  (s.replace(/[^\p{L}\p{N}_ -]+/gu, '').trim() || 'spiel').slice(0, 60)

/** Importiert ein Spiel als neues Spiel (neue IDs, damit nichts überschrieben wird). */
export async function importGame(file: File): Promise<Game> {
  const files = unzipSync(new Uint8Array(await file.arrayBuffer()))
  const raw = files['game.json']
  if (!raw) throw new Error('Keine gültige Spieldatei (game.json fehlt).')
  const manifest = JSON.parse(strFromU8(raw)) as Manifest
  if (manifest.format !== 'jeopardy-game') throw new Error('Unbekanntes Dateiformat.')
  const game = manifest.game
  game.id = uid()
  for (const cat of game.categories)
    for (const clue of cat.clues)
      for (const c of [clue.question, clue.answer]) {
        if (!c.media) continue
        const data = files[`media/${c.media.id}`]
        if (!data) {
          delete c.media
          continue
        }
        const newId = uid()
        await saveMedia(newId, new Blob([data as BlobPart], { type: manifest.media[c.media.id] ?? '' }))
        c.media = { ...c.media, id: newId }
      }
  await saveGame(game)
  return game
}
