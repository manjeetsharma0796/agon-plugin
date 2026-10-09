// A draggable slider in the Agon theme: drag or click the track, or focus it and use the arrow
// keys. The value lives here while dragging and is posted to the hooks module on release, so a
// drag redraws only this region, not the pane.

import type { ClientModule } from 'claude-code'

export type SliderProps = {
  label: string
  value: number
  min: number
  max: number
  step: number
  prefix?: string
  suffix?: string
  decimals?: number
  // The surface drawing it, which a Client module is not told: the track is drawn per surface.
  surface?: string
}
type S = { v: number; drag: boolean; was: number }

const EMBER = '#d4bf7c'
const TRACK = '#2f3239'
const TRACK_FILL = '#1d1f24'
const DIM = '#8f9096'
const LABEL_W = 9
const VALUE_W = 9

const Slider: ClientModule<SliderProps, S> = (p, s) => {
  const { Box, Text } = s.elements
  const snap = (x: number) => Math.min(p.max, Math.max(p.min, Math.round(x / p.step) * p.step))
  const trackW = Math.max(8, s.columns - LABEL_W - VALUE_W)
  const at = (col: number) => snap(p.min + ((col - LABEL_W) / Math.max(1, trackW - 1)) * (p.max - p.min))
  // A local value stands only while the props still hold the value it was made over: a strategy
  // switch, or the hooks module taking the posted value, moves the props on.
  const v = s.state && s.state.was === p.value ? s.state.v : p.value

  // Set on every call, so a drag maps through the range drawn now, not the first one.
  s.onPointer(ev => {
    const drag = s.state?.drag === true && s.state.was === p.value
    if (ev.type === 'down' && ev.button === 'left') s.setState({ v: at(ev.x), drag: true, was: p.value })
    else if (ev.type === 'move' && drag) s.setState({ v: at(ev.x), drag: true, was: p.value })
    else if (ev.type === 'up' && drag) {
      const next = at(ev.x)
      s.setState({ v: next, drag: false, was: p.value })
      s.post({ value: next })
    }
  })
  s.onKey(k => {
    const d = k.key === 'right' || k.key === 'up' ? p.step : k.key === 'left' || k.key === 'down' ? -p.step : 0
    if (d === 0) return
    const next = snap(v + (k.shift ? d * 10 : d))
    s.setState({ v: next, drag: false, was: p.value })
    s.post({ value: next })
  })

  const share = Math.min(1, Math.max(0, (v - p.min) / Math.max(p.step, p.max - p.min)))
  const digits = v.toFixed(p.decimals ?? 0).replace(/^(-?\d+)/, m => m.replace(/\B(?=(\d{3})+$)/g, ','))
  const knob = Text({ color: EMBER, bold: true, children: '●' })
  // The terminal draws a cell per glyph, so the track is counted there. A desktop draws ━ wider
  // than a cell, and a block holding a run of them will not shrink but crushes the value beside
  // it; there the track is two solid capsules sized by share, gold then dark, a white knob between.
  let track
  if (p.surface === 'terminal') {
    const fill = Math.round(share * (trackW - 1))
    track = Box({
      flexDirection: 'row',
      children: [Text({ color: EMBER, children: '━'.repeat(fill) }), knob, Text({ color: TRACK, children: '━'.repeat(Math.max(0, trackW - fill - 1)) })],
    })
  } else
    track = Box({
      flexGrow: 1,
      flexDirection: 'row',
      alignItems: 'center',
      children: [
        Box({ width: `${Math.round(share * 100)}%`, borderStyle: 'round', borderColor: EMBER, backgroundColor: EMBER }),
        Text({ color: '#ffffff', bold: true, children: '●' }),
        Box({ flexGrow: 1, borderStyle: 'round', borderColor: TRACK, backgroundColor: TRACK_FILL }),
      ],
    })
  return Box({
    flexDirection: 'row',
    alignItems: 'center',
    children: [
      Box({ width: LABEL_W, flexShrink: 0, children: Text({ color: DIM, wrap: 'truncate-end', children: p.label }) }),
      track,
      Box({ width: VALUE_W, flexShrink: 0, justifyContent: 'flex-end', children: Text({ bold: true, children: `${p.prefix ?? ''}${digits}${p.suffix ?? ''}` }) }),
    ],
  })
}

export default Slider
