// Agon's one-of-N pill: one row of options, each its label with a cell of padding either side and a
// cell between options. The chosen one sits on a soft raised ground in gold, the others dim and lift
// to that ground under the pointer. Click an option, or focus the pill and use the arrow keys or
// space. The choice is posted to the hooks module; a click maps to the option under it by the same
// widths drawn here. A click on the option already chosen is posted too, so picking the same source
// again reloads it. `compact` drops the cell between options, for a pane too narrow for the gaps.
// `outlined` draws each option in its own rounded border, gold on the chosen one, so every option
// reads as something to press; each then takes 2 more cells and 3 rows.

import type { ClientModule } from 'claude-code'

export type SwitchProps = { options: string[]; value: number; surface?: string; compact?: boolean; outlined?: boolean }
type S = { v: number; was: number }

const GOLD = '#d4bf7c'
const RAISE = '#141417'
const DIM = '#8f9096'
const FG = '#ffffff'
const LINE = '#2f3239'

const Switch: ClientModule<SwitchProps, S> = (p, s) => {
  const { Box, Text } = s.elements
  const n = Math.max(1, p.options.length)
  const widths = p.options.map(l => [...l].length + 2 + (p.outlined ? 2 : 0))
  const gap = p.compact ? 0 : 1
  // A local choice stands only while the props still hold the value it was made over.
  const v = s.state && s.state.was === p.value ? s.state.v : p.value
  const choose = (i: number, again = false) => {
    const next = Math.min(n - 1, Math.max(0, i))
    if (next === v && !again) return
    if (next !== v) s.setState({ v: next, was: p.value })
    s.post({ pick: next })
  }
  // The option under a column: each option owns its cells and the gap after it.
  const at = (x: number) => {
    let end = 0
    for (let i = 0; i < n; i++) {
      end += (widths[i] ?? 2) + (i < n - 1 ? gap : 0)
      if (x < end) return i
    }
    return n - 1
  }
  // Set on every call, so the listeners always read the choice drawn now. The highlight moves on the
  // press itself, before the hooks module answers: that is the pressed feedback.
  s.onPointer(ev => {
    if (ev.type === 'down' && ev.button === 'left') choose(at(ev.x), true)
  })
  s.onKey(k => {
    if (k.key === 'left') choose(v - 1)
    else if (k.key === 'right') choose(v + 1)
    else if (k.key === ' ' || k.key === 'return') choose((v + 1) % n)
  })
  return Box({
    flexDirection: 'row',
    alignItems: 'center',
    gap,
    children: p.options.map((label, i) =>
      Box({
        key: `o-${i}`,
        width: widths[i],
        flexShrink: 0,
        justifyContent: 'center',
        ...(p.outlined ? { borderStyle: 'round', borderColor: i === v ? GOLD : LINE } : {}),
        backgroundColor: i === v ? RAISE : undefined,
        hover: i === v ? undefined : { backgroundColor: RAISE },
        children: Text({ color: i === v ? GOLD : DIM, bold: i === v, hover: i === v ? undefined : { color: FG }, children: label }),
      }),
    ),
  })
}

export default Switch
