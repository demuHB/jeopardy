export type MediaKind = 'image' | 'video' | 'audio'

export interface MediaRef {
  kind: MediaKind
  id: string
  name?: string
}

export interface Content {
  text: string
  media?: MediaRef
}

export interface Clue {
  id: string
  question: Content
  answer: Content
  /** Überschreibt den Zeilenwert, wenn gesetzt. */
  value?: number
}

export interface Category {
  id: string
  name: string
  clues: Clue[]
}

export interface GameSettings {
  /** Wer die Frage gewählt hat, bekommt bei richtiger Antwort die doppelte Punktzahl. */
  chooserDoubles: boolean
}

export interface Game {
  id: string
  title: string
  /** Punktwert je Zeile; die Länge bestimmt die Anzahl Fragen pro Kategorie. */
  values: number[]
  categories: Category[]
  settings: GameSettings
  updatedAt: number
}

export interface Player {
  id: string
  name: string
  score: number
}

export interface ScoreEvent {
  clueId: string
  chooserId: string
  awards: Record<string, number>
  prevIndex: number
}

export type SessionPhase = 'draw' | 'board' | 'final'

export interface Session {
  gameId: string
  /** Reihenfolge, in der gewählt wird. */
  players: Player[]
  currentIndex: number
  played: string[]
  chooserDoubles: boolean
  phase: SessionPhase
  history: ScoreEvent[]
  startedAt: number
}
