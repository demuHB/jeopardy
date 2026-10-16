import type { Category, Clue, Content, Game } from './types'

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export const emptyContent = (): Content => ({ text: '' })

export const newClue = (): Clue => ({ id: uid(), question: emptyContent(), answer: emptyContent() })

export const newCategory = (rows: number, name = ''): Category => ({
  id: uid(),
  name,
  clues: Array.from({ length: rows }, newClue),
})

export function defaultValues(rows: number, step = 100): number[] {
  return Array.from({ length: rows }, (_, i) => step * (i + 1))
}

export function newGame(title = 'Neues Spiel', cols = 5, rows = 5): Game {
  return {
    id: uid(),
    title,
    values: defaultValues(rows),
    categories: Array.from({ length: cols }, (_, i) => newCategory(rows, `Kategorie ${i + 1}`)),
    settings: { chooserDoubles: true },
    updatedAt: Date.now(),
  }
}

/** Passt die Anzahl der Zeilen an; neue Zeilen setzen die Werte-Reihe fort. */
export function setRowCount(game: Game, rows: number): Game {
  const values = game.values.slice(0, rows)
  while (values.length < rows) {
    const n = values.length
    const step = n >= 2 ? values[n - 1] - values[n - 2] : n === 1 ? values[0] : 100
    values.push((values[n - 1] ?? 0) + (step || 100))
  }
  const categories = game.categories.map((c) => {
    const clues = c.clues.slice(0, rows)
    while (clues.length < rows) clues.push(newClue())
    return { ...c, clues }
  })
  return { ...game, values, categories }
}

export function setColCount(game: Game, cols: number): Game {
  const categories = game.categories.slice(0, cols)
  while (categories.length < cols) {
    categories.push(newCategory(game.values.length, `Kategorie ${categories.length + 1}`))
  }
  return { ...game, categories }
}

export const isContentEmpty = (c: Content) => !c.text.trim() && !c.media

export const isClueEmpty = (c: Clue) => isContentEmpty(c.question)

export const clueValue = (game: Game, row: number, clue: Clue) => clue.value ?? game.values[row] ?? 0

export function totalClues(game: Game): number {
  return game.categories.reduce((n, c) => n + c.clues.length, 0)
}

/** Alle in einem Spiel referenzierten Medien-IDs. */
export function mediaIds(game: Game): string[] {
  const ids: string[] = []
  for (const cat of game.categories)
    for (const clue of cat.clues)
      for (const c of [clue.question, clue.answer]) if (c.media) ids.push(c.media.id)
  return ids
}

export function mediaKindFromMime(mime: string): 'image' | 'video' | 'audio' | null {
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  return null
}
