import { useEffect, useState } from 'react'
import type { Clue, Content, Game, Player, Session } from '../types'
import { deleteSession, saveSession } from '../storage'
import { applyAwards, computeAwards } from '../scoring'
import { clueValue, isContentEmpty, totalClues } from '../util'
import { MediaView } from '../components/MediaView'
import { Wheel } from '../components/Wheel'
import { Modal } from '../components/Modal'

interface Props {
  game: Game
  initial: Session
  onExit: () => void
  onRestart: () => void
}

interface Selected {
  col: number
  row: number
}

export function Play({ game, initial, onExit, onRestart }: Props) {
  const [session, setSession] = useState(initial)
  const [selected, setSelected] = useState<Selected | null>(null)
  const [editScore, setEditScore] = useState<Player | null>(null)

  useEffect(() => {
    void saveSession(session)
  }, [session])

  const current = session.players[session.currentIndex]
  const played = new Set(session.played)

  if (session.phase === 'draw') {
    return (
      <div className="screen draw">
        <header className="toolbar">
          <button onClick={onExit}>← Übersicht</button>
          <h2>{game.title}</h2>
        </header>
        <Wheel players={session.players} onDone={(i) => setSession({ ...session, currentIndex: i, phase: 'board' })} />
      </div>
    )
  }

  if (session.phase === 'final') {
    return <Final session={session} game={game} onExit={onExit} onRestart={onRestart} />
  }

  function award(clue: Clue, correctIds: string[], value: number) {
    const awards = computeAwards(session.players, current.id, correctIds, value, session.chooserDoubles)
    const playedNext = [...session.played, clue.id]
    const done = playedNext.length >= totalClues(game)
    setSession({
      ...session,
      players: applyAwards(session.players, awards),
      played: playedNext,
      currentIndex: (session.currentIndex + 1) % session.players.length,
      history: [...session.history, { clueId: clue.id, chooserId: current.id, awards, prevIndex: session.currentIndex }],
      phase: done ? 'final' : 'board',
    })
    setSelected(null)
  }

  function undo() {
    const last = session.history[session.history.length - 1]
    if (!last) return
    setSession({
      ...session,
      players: applyAwards(session.players, last.awards, -1),
      played: session.played.filter((id) => id !== last.clueId),
      currentIndex: last.prevIndex,
      history: session.history.slice(0, -1),
      phase: 'board',
    })
  }

  const cols = game.categories.length
  const sel = selected && game.categories[selected.col]

  return (
    <div className="screen play">
      <header className="toolbar play-bar">
        <button onClick={onExit}>← Übersicht</button>
        <div className="turn">
          Am Zug: <b>{current.name}</b>
        </div>
        <div className="play-bar-right">
          <button onClick={undo} disabled={session.history.length === 0} title="Letzte Frage zurücknehmen">
            ↶ Rückgängig
          </button>
          <button onClick={() => confirm('Spiel jetzt beenden und Endstand zeigen?') && setSession({ ...session, phase: 'final' })}>
            Spiel beenden
          </button>
        </div>
      </header>

      <div className="board" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {game.categories.map((cat) => (
          <div key={cat.id} className="board-cat">
            <span>{cat.name}</span>
          </div>
        ))}
        {game.values.map((_, ri) =>
          game.categories.map((cat, ci) => {
            const clue = cat.clues[ri]
            const isPlayed = played.has(clue.id)
            return (
              <button
                key={clue.id}
                className={`board-cell ${isPlayed ? 'played' : ''}`}
                disabled={isPlayed}
                onClick={() => setSelected({ col: ci, row: ri })}
              >
                {isPlayed ? '' : clueValue(game, ri, clue)}
              </button>
            )
          }),
        )}
      </div>

      <Scoreboard players={session.players} currentId={current.id} onEdit={setEditScore} />

      {selected && sel && (
        <QuestionView
          category={sel.name}
          clue={sel.clues[selected.row]}
          value={clueValue(game, selected.row, sel.clues[selected.row])}
          players={session.players}
          chooser={current}
          chooserDoubles={session.chooserDoubles}
          onCancel={() => setSelected(null)}
          onAward={award}
        />
      )}

      {editScore && (
        <ScoreDialog
          player={editScore}
          onClose={() => setEditScore(null)}
          onSave={(score) => {
            setSession({ ...session, players: session.players.map((p) => (p.id === editScore.id ? { ...p, score } : p)) })
            setEditScore(null)
          }}
        />
      )}
    </div>
  )
}

function Scoreboard({ players, currentId, onEdit }: { players: Player[]; currentId: string; onEdit: (p: Player) => void }) {
  return (
    <div className="scoreboard">
      {players.map((p) => (
        <button
          key={p.id}
          className={`score-card ${p.id === currentId ? 'active' : ''}`}
          onClick={() => onEdit(p)}
          title="Punkte korrigieren"
        >
          <span className="score-name">{p.name}</span>
          <span className={`score-value ${p.score < 0 ? 'neg' : ''}`}>{p.score}</span>
        </button>
      ))}
    </div>
  )
}

function ScoreDialog({ player, onClose, onSave }: { player: Player; onClose: () => void; onSave: (n: number) => void }) {
  const [val, setVal] = useState(String(player.score))
  return (
    <Modal onClose={onClose}>
      <form
        className="score-dialog"
        onSubmit={(e) => {
          e.preventDefault()
          onSave(Number(val) || 0)
        }}
      >
        <h2>Punkte von {player.name}</h2>
        <input autoFocus type="number" value={val} onChange={(e) => setVal(e.target.value)} />
        <div className="dialog-footer">
          <button type="button" onClick={onClose}>Abbrechen</button>
          <button type="submit" className="primary">Speichern</button>
        </div>
      </form>
    </Modal>
  )
}

function ContentView({ content }: { content: Content }) {
  return (
    <div className="content-view">
      {content.text && <div className="content-text">{content.text}</div>}
      {content.media && <MediaView media={content.media} />}
    </div>
  )
}

function QuestionView({
  category,
  clue,
  value,
  players,
  chooser,
  chooserDoubles,
  onCancel,
  onAward,
}: {
  category: string
  clue: Clue
  value: number
  players: Player[]
  chooser: Player
  chooserDoubles: boolean
  onCancel: () => void
  onAward: (clue: Clue, correctIds: string[], value: number) => void
}) {
  const [revealed, setRevealed] = useState(false)
  const [correct, setCorrect] = useState<Set<string>>(new Set())
  const preview = computeAwards(players, chooser.id, correct, value, chooserDoubles)

  function toggle(id: string) {
    const next = new Set(correct)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setCorrect(next)
  }

  return (
    <div className="question-overlay">
      <div className="question-head">
        <span>{category}</span>
        <span className="question-value">{value}</span>
        <span>
          gewählt von <b>{chooser.name}</b>
          {chooserDoubles && ' (×2)'}
        </span>
      </div>

      <div className="question-body">
        {isContentEmpty(clue.question) ? <div className="content-text muted">(keine Frage hinterlegt)</div> : <ContentView content={clue.question} />}
        {revealed && (
          <div className="answer-block">
            <div className="answer-label">Antwort</div>
            {isContentEmpty(clue.answer) ? <div className="content-text muted">(keine Antwort hinterlegt)</div> : <ContentView content={clue.answer} />}
          </div>
        )}
      </div>

      <div className="question-foot">
        {!revealed ? (
          <>
            <button onClick={onCancel}>Zurück zum Brett</button>
            <button className="primary big" onClick={() => setRevealed(true)}>
              Antwort zeigen
            </button>
          </>
        ) : (
          <>
            <div className="correct-label">Wer hat richtig geantwortet?</div>
            <div className="correct-list">
              {players.map((p) => (
                <button key={p.id} className={`correct-btn ${correct.has(p.id) ? 'on' : ''}`} onClick={() => toggle(p.id)}>
                  <span className="check-box">{correct.has(p.id) ? '✓' : ''}</span>
                  {p.name}
                  {p.id === chooser.id && <span className="chooser-tag">Wähler</span>}
                  {preview[p.id] ? <span className="plus">+{preview[p.id]}</span> : null}
                </button>
              ))}
            </div>
            <button className="primary big" onClick={() => onAward(clue, [...correct], value)}>
              {correct.size === 0 ? 'Niemand richtig – weiter' : 'Punkte vergeben & weiter'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function Final({ session, game, onExit, onRestart }: { session: Session; game: Game; onExit: () => void; onRestart: () => void }) {
  const ranked = [...session.players].sort((a, b) => b.score - a.score)
  const top = ranked[0]?.score
  return (
    <div className="screen final">
      <h1 className="logo">Endstand</h1>
      <h2>{game.title}</h2>
      <ol className="ranking">
        {ranked.map((p) => (
          <li key={p.id} className={p.score === top ? 'winner' : ''}>
            <span className="rank">{ranked.findIndex((x) => x.score === p.score) + 1}.</span>
            <span className="rank-name">
              {p.score === top && '🏆 '}
              {p.name}
            </span>
            <span className="rank-score">{p.score}</span>
          </li>
        ))}
      </ol>
      <div className="home-actions">
        <button className="primary big" onClick={() => deleteSession(game.id).then(onRestart)}>
          Nochmal spielen
        </button>
        <button className="big" onClick={onExit}>
          Zur Übersicht
        </button>
      </div>
    </div>
  )
}
