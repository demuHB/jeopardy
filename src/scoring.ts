import type { Player } from './types'

/**
 * Punkte für eine Frage: Alle, die richtig lagen, bekommen den Wert.
 * Der Wähler bekommt bei richtiger Antwort das Doppelte, wenn die Option aktiv ist.
 * Falsche Antworten geben 0 Punkte.
 */
export function computeAwards(
  players: Player[],
  chooserId: string,
  correctIds: Iterable<string>,
  value: number,
  chooserDoubles: boolean,
): Record<string, number> {
  const correct = new Set(correctIds)
  const awards: Record<string, number> = {}
  for (const p of players) {
    if (!correct.has(p.id)) continue
    awards[p.id] = p.id === chooserId && chooserDoubles ? value * 2 : value
  }
  return awards
}

export function applyAwards(players: Player[], awards: Record<string, number>, sign = 1): Player[] {
  return players.map((p) => (awards[p.id] ? { ...p, score: p.score + sign * awards[p.id] } : p))
}
