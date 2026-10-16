import { createStore, del, delMany, get, keys, set, values } from 'idb-keyval'
import type { Game, Session } from './types'
import { mediaIds, uid } from './util'

// idb-keyval unterstützt nur einen Store pro Datenbank, daher drei Datenbanken.
const gameStore = createStore('jeopardy-games', 'games')
const mediaStore = createStore('jeopardy-media', 'media')
const sessionStore = createStore('jeopardy-sessions', 'sessions')

export async function listGames(): Promise<Game[]> {
  const all = (await values(gameStore)) as Game[]
  return all.sort((a, b) => b.updatedAt - a.updatedAt)
}

export const loadGame = (id: string) => get<Game>(id, gameStore)

export const saveGame = (game: Game) => set(game.id, { ...game, updatedAt: Date.now() }, gameStore)

export async function deleteGame(game: Game): Promise<void> {
  await delMany(mediaIds(game), mediaStore)
  await del(game.id, gameStore)
  await del(game.id, sessionStore)
}

/** Kopiert ein Spiel inklusive eigener Kopien aller Medien. */
export async function duplicateGame(game: Game): Promise<Game> {
  const copy: Game = structuredClone(game)
  copy.id = uid()
  copy.title = `${game.title} (Kopie)`
  for (const cat of copy.categories) {
    cat.id = uid()
    for (const clue of cat.clues) {
      clue.id = uid()
      for (const c of [clue.question, clue.answer]) {
        if (!c.media) continue
        const blob = await loadMedia(c.media.id)
        const newId = uid()
        if (blob) await saveMedia(newId, blob)
        c.media = { ...c.media, id: newId }
      }
    }
  }
  await saveGame(copy)
  return copy
}

export const loadMedia = (id: string) => get<Blob>(id, mediaStore)
export const saveMedia = (id: string, blob: Blob) => set(id, blob, mediaStore)
export const deleteMedia = (id: string) => del(id, mediaStore)

/** Löscht Medien, die von keinem Spiel mehr referenziert werden. */
export async function cleanupMedia(): Promise<void> {
  const used = new Set((await listGames()).flatMap(mediaIds))
  const all = (await keys(mediaStore)) as string[]
  await delMany(all.filter((k) => !used.has(k)), mediaStore)
}

export const loadSession = (gameId: string) => get<Session>(gameId, sessionStore)
export const saveSession = (s: Session) => set(s.gameId, s, sessionStore)
export const deleteSession = (gameId: string) => del(gameId, sessionStore)

export async function requestPersistence(): Promise<void> {
  try {
    await navigator.storage?.persist?.()
  } catch {
    /* nicht unterstützt */
  }
}
