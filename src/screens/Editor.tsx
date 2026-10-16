import { useEffect, useRef, useState } from 'react'
import type { Clue, Game } from '../types'
import { cleanupMedia, saveGame } from '../storage'
import { clueValue, defaultValues, isClueEmpty, setColCount, setRowCount } from '../util'
import { ContentEditor } from '../components/ContentEditor'
import { Modal } from '../components/Modal'

interface Props {
  initial: Game
  onBack: () => void
  onPlay: (game: Game) => void
}

const MAX = 10

export function Editor({ initial, onBack, onPlay }: Props) {
  const [game, setGame] = useState(initial)
  const [open, setOpen] = useState<{ col: number; row: number } | null>(null)
  const [saved, setSaved] = useState(true)
  const latest = useRef(game)
  latest.current = game

  // Automatisch speichern, kurz nach jeder Änderung.
  useEffect(() => {
    if (game === initial) return
    setSaved(false)
    const t = setTimeout(() => saveGame(game).then(() => setSaved(true)), 400)
    return () => clearTimeout(t)
  }, [game, initial])

  useEffect(
    () => () => {
      void saveGame(latest.current).then(cleanupMedia)
    },
    [],
  )

  const rows = game.values.length
  const cols = game.categories.length

  function updateClue(col: number, row: number, clue: Clue) {
    setGame((g) => ({
      ...g,
      categories: g.categories.map((c, ci) =>
        ci === col ? { ...c, clues: c.clues.map((cl, ri) => (ri === row ? clue : cl)) } : c,
      ),
    }))
  }

  function moveCategory(col: number, dir: -1 | 1) {
    const to = col + dir
    if (to < 0 || to >= cols) return
    setGame((g) => {
      const cats = [...g.categories]
      ;[cats[col], cats[to]] = [cats[to], cats[col]]
      return { ...g, categories: cats }
    })
  }

  function removeCategory(col: number) {
    if (cols <= 1) return
    const cat = game.categories[col]
    const hasContent = cat.clues.some((c) => !isClueEmpty(c))
    if (hasContent && !confirm(`Kategorie „${cat.name || 'ohne Namen'}“ mit allen Fragen löschen?`)) return
    setGame((g) => ({ ...g, categories: g.categories.filter((_, i) => i !== col) }))
  }

  function changeRows(n: number) {
    if (n < 1 || n > MAX) return
    if (n < rows && game.categories.some((c) => c.clues.slice(n).some((cl) => !isClueEmpty(cl)))) {
      if (!confirm('Die unterste Zeile enthält Fragen. Trotzdem entfernen?')) return
    }
    setGame((g) => setRowCount(g, n))
  }

  function changeCols(n: number) {
    if (n < 1 || n > MAX) return
    if (n < cols) return removeCategory(cols - 1)
    setGame((g) => setColCount(g, n))
  }

  const empty = game.categories.reduce((n, c) => n + c.clues.filter(isClueEmpty).length, 0)
  const openClue = open && game.categories[open.col]?.clues[open.row]

  return (
    <div className="screen editor">
      <header className="toolbar">
        <button onClick={onBack}>← Übersicht</button>
        <input
          className="title-input"
          value={game.title}
          onChange={(e) => setGame({ ...game, title: e.target.value })}
          placeholder="Spieltitel"
        />
        <span className="save-state">{saved ? 'Gespeichert' : 'Speichert …'}</span>
        <button className="primary" onClick={() => saveGame(game).then(() => onPlay(game))}>
          ▶ Spielen
        </button>
      </header>

      <section className="editor-settings">
        <div className="stepper">
          <span>Kategorien</span>
          <button onClick={() => changeCols(cols - 1)} disabled={cols <= 1}>−</button>
          <b>{cols}</b>
          <button onClick={() => changeCols(cols + 1)} disabled={cols >= MAX}>+</button>
        </div>
        <div className="stepper">
          <span>Fragen pro Kategorie</span>
          <button onClick={() => changeRows(rows - 1)} disabled={rows <= 1}>−</button>
          <b>{rows}</b>
          <button onClick={() => changeRows(rows + 1)} disabled={rows >= MAX}>+</button>
        </div>
        <div className="quick-values">
          <span>Werte:</span>
          {[100, 200, 500, 1].map((step) => (
            <button key={step} onClick={() => setGame({ ...game, values: defaultValues(rows, step) })}>
              {defaultValues(Math.min(rows, 3), step).join(', ')} …
            </button>
          ))}
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={game.settings.chooserDoubles}
            onChange={(e) => setGame({ ...game, settings: { ...game.settings, chooserDoubles: e.target.checked } })}
          />
          Wer die Frage wählt, bekommt bei richtiger Antwort doppelte Punkte
        </label>
      </section>

      {empty > 0 && <p className="hint">Noch {empty} leere Felder – zum Bearbeiten ein Feld anklicken.</p>}

      <div className="edit-grid" style={{ gridTemplateColumns: `5.5rem repeat(${cols}, minmax(9rem, 1fr))` }}>
        <div className="edit-corner">Wert</div>
        {game.categories.map((cat, ci) => (
          <div key={cat.id} className="edit-cat">
            <input
              value={cat.name}
              placeholder="Kategorie"
              onChange={(e) =>
                setGame({
                  ...game,
                  categories: game.categories.map((c, i) => (i === ci ? { ...c, name: e.target.value } : c)),
                })
              }
            />
            <div className="cat-actions">
              <button title="Nach links" onClick={() => moveCategory(ci, -1)} disabled={ci === 0}>◀</button>
              <button title="Löschen" onClick={() => removeCategory(ci)} disabled={cols <= 1}>✕</button>
              <button title="Nach rechts" onClick={() => moveCategory(ci, 1)} disabled={ci === cols - 1}>▶</button>
            </div>
          </div>
        ))}
        {game.values.map((v, ri) => (
          <RowCells key={ri} ri={ri} value={v} game={game} setGame={setGame} onOpen={(col) => setOpen({ col, row: ri })} />
        ))}
      </div>

      {open && openClue && (
        <ClueDialog
          game={game}
          col={open.col}
          row={open.row}
          clue={openClue}
          onChange={(c) => updateClue(open.col, open.row, c)}
          onClose={() => setOpen(null)}
          onNavigate={(col, row) => setOpen({ col, row })}
        />
      )}
    </div>
  )
}

function RowCells({
  ri,
  value,
  game,
  setGame,
  onOpen,
}: {
  ri: number
  value: number
  game: Game
  setGame: (g: Game) => void
  onOpen: (col: number) => void
}) {
  return (
    <>
      <input
        className="row-value"
        type="number"
        value={value}
        onChange={(e) => setGame({ ...game, values: game.values.map((x, i) => (i === ri ? Number(e.target.value) : x)) })}
      />
      {game.categories.map((cat, ci) => {
        const clue = cat.clues[ri]
        const empty = isClueEmpty(clue)
        const media = clue.question.media || clue.answer.media
        return (
          <button key={cat.id} className={`edit-cell ${empty ? 'empty' : ''}`} onClick={() => onOpen(ci)}>
            <span className="edit-cell-value">{clueValue(game, ri, clue)}</span>
            <span className="edit-cell-text">{empty ? 'leer' : clue.question.text || '(nur Medium)'}</span>
            {media && <span className="edit-cell-media">{mediaIcons(clue)}</span>}
          </button>
        )
      })}
    </>
  )
}

function mediaIcons(clue: Clue) {
  const icon = { image: '🖼', video: '🎬', audio: '♪' }
  return [clue.question.media, clue.answer.media]
    .filter(Boolean)
    .map((m) => icon[m!.kind])
    .join(' ')
}

function ClueDialog({
  game,
  col,
  row,
  clue,
  onChange,
  onClose,
  onNavigate,
}: {
  game: Game
  col: number
  row: number
  clue: Clue
  onChange: (c: Clue) => void
  onClose: () => void
  onNavigate: (col: number, row: number) => void
}) {
  const cat = game.categories[col]
  const rows = game.values.length
  const cols = game.categories.length
  const idx = col * rows + row
  const total = rows * cols
  const go = (i: number) => onNavigate(Math.floor(i / rows), i % rows)

  return (
    <Modal onClose={onClose} wide>
      <div className="clue-dialog">
        <div className="clue-dialog-head">
          <h2>
            {cat.name || 'Kategorie'} · {clueValue(game, row, clue)}
          </h2>
          <label className="value-override">
            Eigener Wert
            <input
              type="number"
              placeholder={String(game.values[row])}
              value={clue.value ?? ''}
              onChange={(e) => onChange({ ...clue, value: e.target.value === '' ? undefined : Number(e.target.value) })}
            />
          </label>
        </div>
        <ContentEditor
          label="Frage"
          value={clue.question}
          placeholder="Was wird angezeigt, wenn das Feld gewählt wird?"
          onChange={(question) => onChange({ ...clue, question })}
        />
        <ContentEditor
          label="Antwort"
          value={clue.answer}
          placeholder="Die richtige Antwort"
          onChange={(answer) => onChange({ ...clue, answer })}
        />
        <div className="dialog-footer">
          <button onClick={() => go(idx - 1)} disabled={idx === 0}>← Vorherige</button>
          <button className="primary" onClick={onClose}>Fertig</button>
          <button onClick={() => go(idx + 1)} disabled={idx === total - 1}>Nächste →</button>
        </div>
      </div>
    </Modal>
  )
}
