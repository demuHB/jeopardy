import { describe, expect, it } from 'vitest'
import { applyAwards, computeAwards } from './scoring'

const players = [
  { id: 'a', name: 'Anna', score: 0 },
  { id: 'b', name: 'Ben', score: 100 },
  { id: 'c', name: 'Cem', score: 0 },
]

describe('computeAwards', () => {
  it('verdoppelt für den Wähler, wenn aktiv', () => {
    expect(computeAwards(players, 'a', ['a', 'b'], 200, true)).toEqual({ a: 400, b: 200 })
  })
  it('kein Verdoppeln, wenn deaktiviert', () => {
    expect(computeAwards(players, 'a', ['a', 'b'], 200, false)).toEqual({ a: 200, b: 200 })
  })
  it('Wähler falsch: nur die anderen bekommen Punkte', () => {
    expect(computeAwards(players, 'a', ['b', 'c'], 300, true)).toEqual({ b: 300, c: 300 })
  })
  it('niemand richtig', () => {
    expect(computeAwards(players, 'a', [], 300, true)).toEqual({})
  })
})

describe('applyAwards', () => {
  it('addiert und macht rückgängig', () => {
    const awards = { a: 400, b: 200 }
    const after = applyAwards(players, awards)
    expect(after.map((p) => p.score)).toEqual([400, 300, 0])
    expect(applyAwards(after, awards, -1).map((p) => p.score)).toEqual([0, 100, 0])
  })
})
