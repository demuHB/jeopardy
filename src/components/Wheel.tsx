import { useState } from 'react'
import type { Player } from '../types'

const COLORS = ['#e63946', '#f4a261', '#2a9d8f', '#8e44ad', '#f1c40f', '#3498db', '#e67e22', '#16a085', '#d35400', '#c0392b', '#27ae60', '#9b59b6']
const SPIN_MS = 5500

interface Props {
  players: Player[]
  onDone: (winnerIndex: number) => void
}

/** Glücksrad, das den Startspieler auslost. */
export function Wheel({ players, onDone }: Props) {
  const [rotation, setRotation] = useState(0)
  const [state, setState] = useState<'idle' | 'spinning' | 'done'>('idle')
  const [winner, setWinner] = useState<number | null>(null)
  const n = players.length
  const seg = 360 / n

  function spin() {
    const w = Math.floor(Math.random() * n)
    // Segment w liegt (im Uhrzeigersinn ab oben) bei [w*seg, (w+1)*seg]; es soll unter dem Zeiger oben landen.
    const jitter = (Math.random() - 0.5) * seg * 0.7
    const target = 360 * (6 + Math.floor(Math.random() * 3)) - (w * seg + seg / 2 + jitter)
    setWinner(w)
    setState('spinning')
    setRotation(target)
    setTimeout(() => setState('done'), SPIN_MS + 100)
  }

  const r = 200
  const paths = players.map((p, i) => {
    const color = COLORS[i % COLORS.length]
    if (n === 1) return <circle key={p.id} cx={0} cy={0} r={r} fill={color} />
    const a0 = ((i * seg - 90) * Math.PI) / 180
    const a1 = (((i + 1) * seg - 90) * Math.PI) / 180
    const large = seg > 180 ? 1 : 0
    const d = `M0,0 L${r * Math.cos(a0)},${r * Math.sin(a0)} A${r},${r} 0 ${large} 1 ${r * Math.cos(a1)},${r * Math.sin(a1)} Z`
    return <path key={p.id} d={d} fill={color} stroke="#fff" strokeWidth={3} />
  })
  const labels = players.map((p, i) => {
    const mid = i * seg + seg / 2
    const name = p.name.length > 14 ? p.name.slice(0, 13) + '…' : p.name
    return (
      <g key={p.id} transform={`rotate(${mid - 90})`}>
        <text x={r * 0.58} y={0} dominantBaseline="middle" textAnchor="middle" className="wheel-label">
          {name}
        </text>
      </g>
    )
  })

  return (
    <div className="wheel-wrap">
      <div className="wheel-stage">
        <div className="wheel-pointer" />
        <svg
          viewBox="-210 -210 420 420"
          className="wheel"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: state === 'idle' ? 'none' : `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.6, 0.15, 1)`,
          }}
        >
          <circle r={208} fill="#fff" />
          {paths}
          {labels}
          <circle r={26} fill="#0a1a8c" stroke="#f5c542" strokeWidth={5} />
        </svg>
      </div>
      <div className="wheel-result">
        {state === 'idle' && (
          <button className="primary big" onClick={spin}>
            Auslosen!
          </button>
        )}
        {state === 'spinning' && <p className="spinning-text">Wer fängt an …?</p>}
        {state === 'done' && winner !== null && (
          <>
            <p className="winner-text">
              <b>{players[winner].name}</b> fängt an!
            </p>
            <button className="primary big" onClick={() => onDone(winner)}>
              Los geht’s
            </button>
          </>
        )}
      </div>
    </div>
  )
}
