// Agon's on/off switch, as a trading app draws an agent's kill switch: a track with a knob, green with
// the knob at the right when on, grey with it at the left when off, and On or Off beside it so the
// state never rests on colour alone. A click, or Enter or space while it holds the focus, flips it at
// once on screen and posts the new state to the hooks module, which owns the bot and redraws from it.

import type { ClientModule } from 'claude-code'

export type ToggleProps = { on: boolean }
type S = { on: boolean; was: boolean }

const UP = '#3fbf8f'
const LINE = '#2f3239'
const FG = '#ffffff'
const DIM = '#8f9096'

const Toggle: ClientModule<ToggleProps, S> = (p, s) => {
  const { Box, Text } = s.elements
  // A local flip stands only while the props still hold the state it was made over.
  const on = s.state && s.state.was === p.on ? s.state.on : p.on
  const flip = () => {
    s.setState({ on: !on, was: p.on })
    s.post({ on: !on })
  }
  s.onPointer(ev => {
    if (ev.type === 'down' && ev.button === 'left') flip()
  })
  s.onKey(k => {
    if (k.key === 'return' || k.key === ' ') flip()
  })
  return Box({
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    children: [
      Box({
        key: 'track',
        width: 4,
        flexShrink: 0,
        flexDirection: 'row',
        justifyContent: on ? 'flex-end' : 'flex-start',
        backgroundColor: on ? UP : LINE,
        children: Text({ color: FG, bold: true, children: '●' }),
      }),
      Text({ key: 'word', color: on ? UP : DIM, bold: on, children: on ? 'On' : 'Off' }),
    ],
  })
}

export default Toggle
