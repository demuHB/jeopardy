import { useState } from 'react'
import type { Game, Player } from '../types'
import { isClueEmpty, uid } from '../util'

interface Props {
  game: Game
  onBack: () => void
  onStart: (players: Player[], chooserDoubles: boolean) => void
}

const LAST_PLAYERS_KEY = 'jeopardy-last-players'

function lastPlayers(): string[] {
  try {
    const raw = localStorage.getItem(LAST_PLAYERS_KEY)
    const names = raw ? (JSON.parse(raw) as string[]) : []
    return names.length ? names : ['', '']
  } catch {
    return ['', '']
  }
}

export function Setup({ game, onBack, onStart }: Props) {
  const [names, setNames] = useState<string[]>(lastPlayers)
  const [doubles, setDoubles] = useState(game.settings.chooserDoubles)
  const filled = names.map((n) => n.trim()).filter(Boolean)
  const empty = game.categories.reduce((n, c) => n + c.clues.filter(isClueEmpty).length, 0)

  function start() {
    try {
      localStorage.setItem(LAST_PLAYERS_KEY, JSON.stringify(filled))
    } catch {
      /* ignorieren */
    }
    onStart(
      filled.map((name) => ({ id: uid(), name, score: 0 })),
      doubles,
    )
  }

  return (
    <div className="screen setup">
      <header className="toolbar">
        <button onClick={onBack}>← Übersicht</button>
        <h2>{game.title}</h2>
      </header>
      <div className="setup-body">
        <h3>Spieler</h3>
        <div className="player-inputs">
          {names.map((n, i) => (
            <div key={i} className="player-input">
              <input
                autoFocus={i === 0}
                value={n}
                placeholder={`Spieler ${i + 1}`}
                onChange={(e) => setNames(names.map((x, j) => (j === i ? e.target.value : x)))}
              />
              <button className="danger" onClick={() => setNames(names.filter((_, j) => j !== i))} disabled={names.length <= 1}>
                ✕
              </button>
            </div>
          ))}
          <button onClick={() => setNames([...names, ''])}>+ Spieler hinzufügen</button>
        </div>

        <label className="check">
          <input type="checkbox" checked={doubles} onChange={(e) => setDoubles(e.target.checked)} />
          Wer die Frage wählt, bekommt bei richtiger Antwort doppelte Punkte
        </label>

        {empty > 0 && <p className="hint warn">Hinweis: {empty} Felder in diesem Spiel sind noch leer.</p>}

        <button className="primary big" disabled={filled.length < 1} onClick={start}>
          Weiter zur Auslosung
        </button>
      </div>
    </div>
  )
}
