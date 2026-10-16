import { useEffect, useRef, useState } from 'react'
import type { Player } from '../types'

const STEPS = 22
const FIRST_DELAY = 55
const LAST_DELAY = 360

interface Props {
  players: Player[]
  onDone: (winnerIndex: number) => void
}

/** Namen wechseln schnell, werden langsamer und bleiben beim Startspieler stehen. */
export function Draw({ players, onDone }: Props) {
  const [shown, setShown] = useState<number | null>(null)
  const [state, setState] = useState<'idle' | 'running' | 'done'>('idle')
  const timer = useRef<number | undefined>(undefined)
  const n = players.length

  useEffect(() => () => clearTimeout(timer.current), [])

  function start() {
    const winner = Math.floor(Math.random() * n)
    // Zufällige Folge ohne direkte Wiederholung, rückwärts vom Gewinner aus gebaut.
    const seq: number[] = [winner]
    for (let i = 1; i < (n > 1 ? STEPS : 1); i++) {
      let next = Math.floor(Math.random() * (n - 1))
      if (next >= seq[0]) next++
      seq.unshift(next)
    }

    setState('running')
    let i = 0
    const tick = () => {
      setShown(seq[i])
      if (i === seq.length - 1) {
        setState('done')
        return
      }
      const t = i / (seq.length - 1)
      const delay = FIRST_DELAY + (LAST_DELAY - FIRST_DELAY) * t * t * t
      i++
      timer.current = window.setTimeout(tick, delay)
    }
    tick()
  }

  return (
    <div className="draw-wrap">
      <div className="draw-label">{state === 'done' ? 'Es fängt an:' : 'Wer fängt an?'}</div>
      <div className={`draw-name ${state}`} key={state === 'done' ? 'done' : 'name'}>
        {shown === null ? '?' : players[shown].name}
      </div>
      <div className="draw-players">
        {players.map((p, i) => (
          <span key={p.id} className={`draw-chip ${i === shown ? 'on' : ''}`}>
            {p.name}
          </span>
        ))}
      </div>
      <div className="draw-actions">
        {state === 'idle' && (
          <button className="primary big" onClick={start}>
            Auslosen!
          </button>
        )}
        {state === 'done' && shown !== null && (
          <button className="primary big" onClick={() => onDone(shown)}>
            Los geht’s
          </button>
        )}
      </div>
    </div>
  )
}
