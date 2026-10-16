import { useState } from 'react'
import type { Game, Player, Session } from './types'
import { deleteSession, loadGame, saveSession } from './storage'
import { Home } from './screens/Home'
import { Editor } from './screens/Editor'
import { Setup } from './screens/Setup'
import { Play } from './screens/Play'

type View =
  | { name: 'home' }
  | { name: 'edit'; game: Game }
  | { name: 'setup'; game: Game }
  | { name: 'play'; game: Game; session: Session }

export function App() {
  const [view, setView] = useState<View>({ name: 'home' })
  const home = () => setView({ name: 'home' })

  // Immer den gespeicherten Stand laden, damit Änderungen aus dem Editor übernommen werden.
  async function setup(game: Game) {
    setView({ name: 'setup', game: (await loadGame(game.id)) ?? game })
  }

  async function start(game: Game, players: Player[], chooserDoubles: boolean) {
    const session: Session = {
      gameId: game.id,
      players,
      currentIndex: 0,
      played: [],
      chooserDoubles,
      phase: 'draw',
      history: [],
      startedAt: Date.now(),
    }
    await deleteSession(game.id)
    await saveSession(session)
    setView({ name: 'play', game, session })
  }

  switch (view.name) {
    case 'home':
      return (
        <Home
          onEdit={(game) => setView({ name: 'edit', game })}
          onPlay={setup}
          onResume={(game, session) => setView({ name: 'play', game, session })}
        />
      )
    case 'edit':
      return <Editor key={view.game.id} initial={view.game} onBack={home} onPlay={setup} />
    case 'setup':
      return (
        <Setup game={view.game} onBack={home} onStart={(players, doubles) => start(view.game, players, doubles)} />
      )
    case 'play':
      return (
        <Play
          key={view.session.startedAt}
          game={view.game}
          initial={view.session}
          onExit={home}
          onRestart={() => setup(view.game)}
        />
      )
  }
}
