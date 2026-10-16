import type { Content, Game } from './types'
import { saveGame, saveMedia } from './storage'
import { newGame, uid } from './util'

const t = (text: string): Content => ({ text })

const FLAG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
<rect width="900" height="200" fill="#000"/><rect y="200" width="900" height="200" fill="#dd0000"/>
<rect y="400" width="900" height="200" fill="#ffce00"/></svg>`

/** Erzeugt eine kurze WAV-Melodie (C-E-G-C) als Beispiel für Audio-Fragen. */
function melodyWav(): Blob {
  const rate = 22050
  const notes = [261.63, 329.63, 392.0, 523.25]
  const dur = 0.35
  const n = Math.floor(rate * dur) * notes.length
  const buf = new ArrayBuffer(44 + n * 2)
  const v = new DataView(buf)
  const str = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)))
  str(0, 'RIFF')
  v.setUint32(4, 36 + n * 2, true)
  str(8, 'WAVE')
  str(12, 'fmt ')
  v.setUint32(16, 16, true)
  v.setUint16(20, 1, true)
  v.setUint16(22, 1, true)
  v.setUint32(24, rate, true)
  v.setUint32(28, rate * 2, true)
  v.setUint16(32, 2, true)
  v.setUint16(34, 16, true)
  str(36, 'data')
  v.setUint32(40, n * 2, true)
  const per = Math.floor(rate * dur)
  for (let i = 0; i < n; i++) {
    const f = notes[Math.floor(i / per)]
    const k = i % per
    const env = Math.min(1, k / 400) * Math.min(1, (per - k) / 1500)
    v.setInt16(44 + i * 2, Math.sin((2 * Math.PI * f * i) / rate) * 0.4 * env * 32767, true)
  }
  return new Blob([buf], { type: 'audio/wav' })
}

export async function createSampleGame(): Promise<Game> {
  const g = newGame('Beispielspiel', 3, 3)
  const flagId = uid()
  const audioId = uid()
  await saveMedia(flagId, new Blob([FLAG_SVG], { type: 'image/svg+xml' }))
  await saveMedia(audioId, melodyWav())

  const data: [string, [Content, Content][]][] = [
    [
      'Geografie',
      [
        [t('Hauptstadt von Frankreich'), t('Paris')],
        [{ text: 'Zu welchem Land gehört diese Flagge?', media: { kind: 'image', id: flagId, name: 'flagge.svg' } }, t('Deutschland')],
        [t('Längster Fluss Europas'), t('Wolga')],
      ],
    ],
    [
      'Musik',
      [
        [t('Wie viele Saiten hat eine normale Gitarre?'), t('6')],
        [{ text: 'Welcher Akkord wird hier nacheinander gespielt?', media: { kind: 'audio', id: audioId, name: 'melodie.wav' } }, t('C-Dur')],
        [t('Wer komponierte „Für Elise“?'), t('Ludwig van Beethoven')],
      ],
    ],
    [
      'Wissen',
      [
        [t('Wie viele Beine hat eine Spinne?'), t('8')],
        [t('Chemisches Symbol für Gold'), t('Au')],
        [t('In welchem Jahr fiel die Berliner Mauer?'), t('1989')],
      ],
    ],
  ]
  g.categories.forEach((cat, ci) => {
    cat.name = data[ci][0]
    cat.clues.forEach((clue, ri) => {
      clue.question = data[ci][1][ri][0]
      clue.answer = data[ci][1][ri][1]
    })
  })
  await saveGame(g)
  return g
}
