import { useEffect, useRef, useState } from 'react'
import type { Game, Session } from '../types'
import { deleteGame, duplicateGame, listGames, loadSession, saveGame } from '../storage'
import { downloadBlob, exportGame, importGame, safeFilename } from '../exportImport'
import { newGame, totalClues } from '../util'
import { createSampleGame } from '../sample'

interface Props {
  onEdit: (g: Game) => void
  onPlay: (g: Game) => void
  onResume: (g: Game, s: Session) => void
}

const SEEDED_KEY = 'jeopardy-seeded'

// Verhindert doppeltes Anlegen des Beispiels (StrictMode ruft Effekte zweimal auf).
let seeding: Promise<unknown> | null = null

export function Home({ onEdit, onPlay, onResume }: Props) {
  const [games, setGames] = useState<Game[] | null>(null)
  const [sessions, setSessions] = useState<Record<string, Session>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function refresh() {
    let list = await listGames()
    let seeded = true
    try {
      seeded = localStorage.getItem(SEEDED_KEY) === '1'
    } catch {
      /* ignorieren */
    }
    if (list.length === 0 && !seeded) {
      seeding ??= createSampleGame()
      await seeding
      try {
        localStorage.setItem(SEEDED_KEY, '1')
      } catch {
        /* ignorieren */
      }
      list = await listGames()
    }
    const s: Record<string, Session> = {}
    for (const g of list) {
      const sess = await loadSession(g.id)
      if (sess && sess.phase !== 'final') s[g.id] = sess
    }
    setSessions(s)
    setGames(list)
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function run(label: string, fn: () => Promise<unknown>) {
    setBusy(label)
    try {
      await fn()
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
      await refresh()
    }
  }

  async function create() {
    const g = newGame()
    await saveGame(g)
    onEdit(g)
  }

  return (
    <div className="screen home">
      <h1 className="logo">JEOPARDY!</h1>
      <div className="home-actions">
        <button className="primary big" onClick={create}>+ Neues Spiel</button>
        <button className="big" onClick={() => fileRef.current?.click()}>Spiel importieren</button>
        <button className="big" onClick={() => run('Beispiel wird angelegt …', createSampleGame)}>Beispielspiel</button>
        <input
          ref={fileRef}
          type="file"
          accept=".zip,application/zip"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) void run('Import läuft …', () => importGame(f))
          }}
        />
      </div>
      {busy && <p className="hint">{busy}</p>}

      {games === null ? (
        <p className="hint">Lade …</p>
      ) : games.length === 0 ? (
        <p className="hint">Noch keine Spiele. Lege ein neues an oder importiere eine Spieldatei.</p>
      ) : (
        <ul className="game-list">
          {games.map((g) => (
            <li key={g.id} className="game-card">
              <div className="game-card-info">
                <h3>{g.title || 'Ohne Titel'}</h3>
                <span>
                  {g.categories.length} Kategorien · {totalClues(g)} Fragen · zuletzt geändert{' '}
                  {new Date(g.updatedAt).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
              <div className="game-card-actions">
                {sessions[g.id] && (
                  <button className="primary" onClick={() => onResume(g, sessions[g.id])}>
                    ▶ Fortsetzen
                  </button>
                )}
                <button className={sessions[g.id] ? '' : 'primary'} onClick={() => onPlay(g)}>
                  {sessions[g.id] ? 'Neu starten' : '▶ Spielen'}
                </button>
                <button onClick={() => onEdit(g)}>Bearbeiten</button>
                <button onClick={() => run('Kopiere …', () => duplicateGame(g))}>Duplizieren</button>
                <button
                  onClick={() =>
                    run('Export läuft …', async () => downloadBlob(await exportGame(g), `${safeFilename(g.title)}.zip`))
                  }
                >
                  Exportieren
                </button>
                <button
                  className="danger"
                  onClick={() => confirm(`„${g.title}“ wirklich löschen?`) && run('Lösche …', () => deleteGame(g))}
                >
                  Löschen
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="footnote">
        Spiele werden in diesem Browser gespeichert. Zum Übertragen auf einen anderen PC: „Exportieren“ und dort „Spiel
        importieren“.
      </p>
    </div>
  )
}
