// The layout bar: every section of a pane as a tile in its lane, Left or Right. Drag a tile to move
// it, inside its lane or across to the other; click a tile to hide or show it. With the focus, up
// and down pick a tile, left and right move it, space hides it. Tiles are boxes a fixed number of
// cells wide, so a pointer lands on the same tile on every surface, whatever width a font draws.
// The hint that says so is drawn by the hooks module under the bar, where it can wrap.

import type { ClientModule } from 'claude-code'

export type LayoutTile = { id: string; label: string }
export type LayoutProps = { main: LayoutTile[]; side: LayoutTile[]; hidden: string[] }
type S = { drag: string | null; x0: number; seq: string[] | null; was: string; pick: string | null }

// The divider between the lanes in a posted sequence; the hooks module splits on the same mark.
const CUT = '|'
const GOLD = '#d4bf7c'
const RAISE = '#141417'
const DIM = '#8f9096'
const INK = '#050506'
const FG = '#ffffff'
const LEAD = 5
const CUT_W = 6

const Layout: ClientModule<LayoutProps, S> = (p, s) => {
  const { Box, Text } = s.elements
  const name: Record<string, string> = {}
  for (const t of [...p.main, ...p.side]) name[t.id] = t.label
  const base = [...p.main.map(t => t.id), CUT, ...p.side.map(t => t.id)]
  const key = base.join(',')
  const st: S = s.state ?? { drag: null, x0: 0, seq: null, was: key, pick: null }
  // A local order stands only until the props move on from the order it was made over.
  const seq = st.seq && st.was === key ? st.seq : base
  const w = (id: string) => (id === CUT ? CUT_W : (name[id]?.length ?? 4) + 2)
  const lefts = (items: string[]) => {
    let x = LEAD
    return items.map(id => {
      const at = x
      x += w(id) + 1
      return at
    })
  }
  const hit = (x: number) => {
    const xs = lefts(seq)
    return seq.find((id, i) => id !== CUT && x >= xs[i]! && x < xs[i]! + w(id)) ?? null
  }
  // Where a dragged tile lands: before the first other item whose middle is right of the pointer.
  const place = (id: string, x: number) => {
    const rest = seq.filter(v => v !== id)
    const xs = lefts(rest)
    const i = rest.findIndex((v, k) => x < xs[k]! + w(v) / 2)
    const at = i < 0 ? rest.length : i
    return [...rest.slice(0, at), id, ...rest.slice(at)]
  }

  // Set on every call, so a listener always maps through the order drawn now.
  s.onPointer(ev => {
    const cur = s.state ?? st
    if (ev.type === 'down' && ev.button === 'left') {
      const id = hit(ev.x)
      if (id) s.setState({ ...cur, drag: id, x0: ev.x, seq: null, was: key, pick: id })
    } else if (ev.type === 'move' && cur.drag && Math.abs(ev.x - cur.x0) >= 2) s.setState({ ...cur, seq: place(cur.drag, ev.x), was: key })
    else if (ev.type === 'up' && cur.drag) {
      if (cur.seq) s.post({ seq: cur.seq })
      else s.post({ toggle: cur.drag })
      s.setState({ ...cur, drag: null })
    }
  })
  s.onKey(k => {
    const cur = s.state ?? st
    const tiles = seq.filter(v => v !== CUT)
    const id = cur.pick && tiles.includes(cur.pick) ? cur.pick : tiles[0]
    if (!id) return
    if (k.key === 'up' || k.key === 'down') {
      const i = tiles.indexOf(id)
      s.setState({ ...cur, pick: tiles[(i + (k.key === 'down' ? 1 : tiles.length - 1)) % tiles.length]! })
    } else if (k.key === 'left' || k.key === 'right') {
      const i = seq.indexOf(id)
      const j = i + (k.key === 'right' ? 1 : -1)
      if (j < 0 || j >= seq.length) return
      const next = [...seq]
      next[i] = next[j]!
      next[j] = id
      s.setState({ ...cur, seq: next, was: key, pick: id })
      s.post({ seq: next })
    } else if (k.key === ' ' || k.key === 'return') s.post({ toggle: id })
  })

  const hidden = new Set(p.hidden)
  const tile = (id: string) =>
    id === CUT
      ? Box({ key: 'cut', width: CUT_W, children: Text({ color: DIM, children: ' Right' }) })
      : Box({
          key: `t-${id}`,
          width: w(id),
          backgroundColor: st.drag === id ? GOLD : RAISE,
          children: Text({
            color: st.drag === id ? INK : hidden.has(id) ? DIM : st.pick === id ? GOLD : FG,
            strikethrough: hidden.has(id),
            wrap: 'truncate-end',
            children: ` ${name[id] ?? id}`,
          }),
        })
  return Box({
    flexDirection: 'row',
    gap: 1,
    children: [
      Box({ key: 'lead', width: LEAD - 1, children: Text({ color: DIM, children: 'Left' }) }),
      ...seq.map(tile),
    ],
  })
}

export default Layout
