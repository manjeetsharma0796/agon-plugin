import { expect, mock, test } from 'claude-code/testing'

import * as PF from './paper-fixtures'

// Every view and the band, mounted at the widths a person really has: 45 cells (a sidebar), 60, 100
// and 160, on the terminal and the desktop. The kit draws no paint, so the drawn tree is measured
// here the way the surfaces lay it out: a row needs the sum of its children and its gaps, a column
// its widest child, a wrapping row its widest item, plus padding and border. Short text never wraps
// and is never cut, so it is counted whole; only text marked wrap="wrap" may break, at its spaces.
// A desktop Button is a native button with its own padding; the terminal draws `[ label ]`.

type Node = { type: string; props: Record<string, unknown>; children: (Node | string)[] }
type Miss = { at: string; need: number; room: number; widest?: string }
type Surface = 'terminal' | 'desktop'

const WIDTHS = [45, 60, 100, 160] as const
const SURFACES = ['terminal', 'desktop'] as const
// A desktop cell is about 7 px of the app font; an Svg's pixels are counted at that.
const PX = 7

const cells = (s: string) => [...s].length
const isNode = (c: unknown): c is Node => typeof c === 'object' && c !== null && 'type' in c
const P = (n: Node) => n.props ?? {}
const kids = (n: Node) => (Array.isArray(n.children) ? n.children : []).filter(isNode)
const textOf = (n: Node | string): string => (typeof n === 'string' ? n : (Array.isArray(n.children) ? n.children : []).map(textOf).join(''))
const num = (v: unknown) => (typeof v === 'number' ? v : 0)
const side = (p: Record<string, unknown>, s: 'Left' | 'Right') => num(p[`padding${s}`] ?? p.paddingX ?? p.padding)
const marg = (p: Record<string, unknown>, s: 'Left' | 'Right') => num(p[`margin${s}`] ?? p.marginX ?? p.margin)
const label = (n: Node) => String(P(n).key ?? (n.type === 'Text' ? `"${textOf(n).slice(0, 24)}"` : n.type))
const out = (n: Node) => P(n).display === 'none' || P(n).position === 'absolute'

function need(n: Node, surface: Surface, misses: Miss[], path: string): number {
  const p = n.props ?? {}
  const at = `${path}/${label(n)}`
  switch (n.type) {
    case 'Text': {
      const s = textOf(n)
      if (p.wrap === 'wrap') return Math.max(0, ...s.split(/\s+/).map(cells))
      // A mint cut in the middle is deliberate: both ends stay readable.
      if (p.wrap === 'truncate-middle') return Math.min(cells(s), 16)
      return Math.max(0, ...s.split('\n').map(cells))
    }
    case 'Button': {
      const l = cells(String(p.label ?? textOf(n)))
      return l + (surface === 'terminal' ? (p.plain ? 0 : 4) : p.plain ? 2 : 4)
    }
    case 'Link':
      return cells(String(p.label ?? textOf(n))) + (surface === 'terminal' ? 0 : 2)
    case 'Input':
      return 12
    case 'Raster':
      return num(p.columns)
    case 'Svg':
      return surface === 'terminal' ? 0 : Math.ceil(num(p.width) / PX)
    case 'Client':
      return typeof p.width === 'number' ? p.width : 0
    case 'Box': {
      const flow = kids(n).filter(k => !out(k))
      const ws = flow.map((k, i) => need(k, surface, misses, `${at}[${i}]`))
      const row = !String(p.flexDirection ?? 'row').startsWith('column')
      const gap = num(p.columnGap ?? p.gap)
      const inner = row && p.flexWrap !== 'wrap' ? ws.reduce((a, w) => a + w, 0) + gap * Math.max(0, ws.length - 1) : Math.max(0, ...ws)
      const frame = side(p, 'Left') + side(p, 'Right') + (p.borderStyle ? 2 : 0)
      if (typeof p.width === 'number') {
        if (inner + frame > p.width) {
          const i = ws.indexOf(Math.max(...ws))
          misses.push({ at, need: inner + frame, room: p.width, widest: flow[i] ? `${label(flow[i]!)} ${ws[i]}` : undefined })
        }
        return p.width + marg(p, 'Left') + marg(p, 'Right')
      }
      return Math.max(num(p.minWidth), inner + frame) + marg(p, 'Left') + marg(p, 'Right')
    }
    default:
      return 0
  }
}

// What does not fit: every fixed-width box too small for what it holds, then the whole tree against
// the room it is drawn in.
function overflow(tree: Node, surface: Surface, room: number) {
  const misses: Miss[] = []
  const total = need(tree, surface, misses, '')
  if (total > room) misses.push({ at: 'root', need: total, room })
  return misses
}

// Controls that wrap onto a second line never touch it: a wrapping row holding a pill or a button
// keeps a row between its lines, and a column holding two control rows keeps one between them.
const controlish = (n: Node): boolean => n.type === 'Client' || (n.type === 'Button' && !P(n).plain) || kids(n).some(controlish)
function touching(n: Node, path = ''): string[] {
  const at = `${path}/${label(n)}`
  const found: string[] = []
  const p = n.props ?? {}
  if (n.type === 'Box' && !out(n)) {
    const flow = kids(n).filter(k => !out(k))
    const row = !String(p.flexDirection ?? 'row').startsWith('column')
    if (row && p.flexWrap === 'wrap' && flow.filter(controlish).length > 1 && num(p.rowGap ?? p.gap) < 1) found.push(at)
    if (!row && num(p.rowGap ?? p.gap) < 1)
      for (let i = 1; i < flow.length; i++) if (flow[i - 1]!.type === 'Box' && flow[i]!.type === 'Box' && pillRow(flow[i - 1]!) && pillRow(flow[i]!)) found.push(`${at}[${i}]`)
  }
  for (const k of kids(n)) found.push(...touching(k, at))
  return found
}
const pillRow = (n: Node): boolean => (n.type === 'Client' && P(n).module === './switch.tsx') || kids(n).some(pillRow)

// The deepest stack of bordered boxes: the page frame is one.
const frames = (n: Node): number => (n.type === 'Box' && !out(n) ? (P(n).borderStyle ? 1 : 0) : 0) + Math.max(0, ...kids(n).map(frames))

const BONK = {
  id: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  symbol: 'Bonk',
  icon: 'https://example.com/bonk.png',
  usdPrice: 0.0000037,
  stats5m: { priceChange: 0.12 },
  stats1h: { priceChange: -1.4 },
  stats6h: { priceChange: 3.25 },
  stats24h: { priceChange: -12.5, buyVolume: 4e6, sellVolume: 3.5e6 },
  mcap: 3.1e8,
  liquidity: 1.2e7,
  holderCount: 912345,
  organicScore: 88,
  audit: { mintAuthorityDisabled: true, freezeAuthorityDisabled: false },
  decimals: 5,
}
const SOL = { ...BONK, id: 'So11111111111111111111111111111111111111112', symbol: 'SOL', usdPrice: 109.2, decimals: 9, mcap: 6.1e10, liquidity: 9.9e8 }
const JUP = { ...BONK, id: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', symbol: 'JUP', usdPrice: 0.4123, decimals: 6 }
const MCP_URL = 'https://agon-dev.onrender.com/mcp'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const world = (on: any, placed = true) => {
  mock.clock(on, { now: Date.parse('2026-10-09T00:00:00Z') })
  const store = new Map<string, unknown>([['wallet', PF.PAPER_ACCOUNT]])
  on('store.get', async (_$: unknown, e: { key: string }) => ({ value: store.get(e.key) }))
  on('store.set', async (_$: unknown, e: { key: string; value: unknown }) => {
    store.set(e.key, e.value)
    return { value: undefined }
  })
  on('command.register', async (_$: unknown, e: { name: string }) => ({ value: { command: e.name } }))
  on('ui.open', async () => ({ value: placed ? { isPlaced: true } : { isPlaced: false, reason: 'no side pane on this surface' } }))
  on('http.fetch', async (_$: unknown, e: { url: string; init?: { body?: unknown } }) => {
    const ok = (text: string) => ({ value: { status: 200, ok: true, headers: {}, text } })
    if (e.url === MCP_URL) {
      const body = JSON.parse(String(e.init?.body)) as { method: string; params?: { name?: string } }
      return ok(body.method === 'tools/list' ? PF.LIST : body.params?.name === 'paper_portfolio' ? PF.PORTFOLIO_AFTER_BUY : PF.BUY_FILLED)
    }
    if (e.url.includes('/ultra/v1/holdings/'))
      return ok(JSON.stringify({ uiAmount: 2.5, tokens: { [BONK.id]: [{ uiAmount: 12_000_000, excludeFromNetWorth: false }], [JUP.id]: [{ uiAmount: 830, excludeFromNetWorth: false }] } }))
    if (e.url.includes('/pools?')) return ok(JSON.stringify({ data: [{ attributes: { address: 'Pool1', reserve_in_usd: '5' } }] }))
    if (e.url.includes('/ohlcv/'))
      return ok(JSON.stringify({ data: { attributes: { ohlcv_list: Array.from({ length: 24 }, (_, i) => [1760000000 - i * 3600, 0, 0, 0, 100 + Math.sin(i) * 9, 1000 + i]) } } }))
    // A quote at the token's price, 0.2% worse each way, in each side's own decimals.
    if (e.url.includes('/swap/v1/quote?')) {
      const arg = (k: string) => e.url.match(new RegExp(`[?&]${k}=([^&]+)`))?.[1] ?? ''
      const of = (mint: string) => [SOL, JUP, BONK].find(t => t.id === mint) ?? { usdPrice: 1, decimals: 6 }
      const [i, o] = [of(arg('inputMint')), of(arg('outputMint'))]
      const usdIn = (Number(arg('amount')) / 10 ** i.decimals) * i.usdPrice
      return ok(JSON.stringify({ outAmount: String(Math.floor(((usdIn * 0.998) / o.usdPrice) * 10 ** o.decimals)) }))
    }
    if (e.url.includes('wsrv.nl')) return ok('data:image/png;base64,AAAA')
    return ok(JSON.stringify([SOL, JUP, BONK]))
  })
  return store
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pane = async ($: any, surface: Surface, bodyColumns: number, view: string) => {
  const p = await $.ui.mount({
    plugin: 'agon',
    surface,
    component: 'Pane',
    requestId: 'agon',
    props: { title: 'Agon', isFocused: true, bodyColumns, placement: 'dock', scroll: { offset: 0, bodyRows: 200 } },
  })
  await p.press({ key: `nav-${view}` })
  return p
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const band = ($: any, surface: Surface, bodyColumns: number, maxRows = 12) =>
  $.ui.mount({ plugin: 'agon', surface, component: 'AbovePrompt', props: { hasSurvey: false, isWorking: false, maxRows, bodyColumns } })

// Loads the list, picks Bonk into Trade, turns paper on and starts one bot, so every view has its
// full content: rows, a chart, an order book, a paper account, a bot with its details.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fill($: any) {
  const first = await pane($, 'desktop', 100, 'discover')
  await first.post({ pick: 0 }, { in: 'src' })
  await first.press({ key: `lb-${BONK.id}` })
  await first.press({ key: 'paper-check' })
  await first.press({ key: 'paper-buy' })
  await first.press({ key: 'signup-continue' })
  await first.press({ key: 'nav-bots' })
  await first.press({ key: 'start' })
  await first.post({ pick: 1 }, { in: 'pm-switch' }).catch(() => undefined)
  await first.press({ key: 'nav-portfolio' })
  await first.post({ pick: 1 }, { in: 'pm-switch' })
  await first.press({ key: 'port-refresh' })
  await first.post({ pick: 0 }, { in: 'pm-switch' })
  await first.unmount()
}

// Every miss as one line a person can act on: where, how much it needs, how much room it has.
const report = (where: string, misses: Miss[]) => misses.map(m => `${where}: ${m.at} needs ${m.need} cells, has ${m.room}${m.widest ? ` (widest: ${m.widest})` : ''}`)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function check(p: any, where: string, surface: Surface, room: number, bad: string[]) {
  const tree = (await p.drawn()) as Node
  bad.push(...report(where, overflow(tree, surface, room)))
  bad.push(...touching(tree).map(t => `${where}: control rows touch at ${t}`))
  // Each pill's own drawing fits the region the hooks module gave it, and the layout bar's tiles fit
  // the page inside its frame.
  const inner = room - (surface === 'desktop' ? 7 : 2)
  for (const c of (await p.findAll({ type: 'Client' })) as { key: string; props: Record<string, unknown> }[]) {
    if (c.props.module !== './switch.tsx' && c.props.module !== './layout.tsx') continue
    const drawn = (await p.drawn({ in: c.key })) as Node
    bad.push(...report(`${where} client ${c.key}`, overflow(drawn, surface, c.props.module === './switch.tsx' ? Number(c.props.width) : inner)))
  }
  return tree
}

const VIEWS: [string, string, ((p: any) => Promise<unknown>) | null][] = [
  ['start', 'start', null],
  ['discover list', 'discover', p => p.post({ pick: 0 }, { in: 'view' })],
  ['discover table', 'discover', p => p.post({ pick: 1 }, { in: 'view' })],
  ['discover cards', 'discover', p => p.post({ pick: 2 }, { in: 'view' })],
  ['discover sort open', 'discover', p => p.press({ key: 'sort' })],
  ['watch', 'watch', null],
  ['trade', 'trade', null],
  ['bots', 'bots', null],
  ['bots layout', 'bots', p => p.press({ key: 'lay' })],
  ['portfolio paper', 'portfolio', p => p.post({ pick: 0 }, { in: 'pm-switch' })],
  ['portfolio mainnet', 'portfolio', p => p.post({ pick: 1 }, { in: 'pm-switch' })],
]

test('every view fits 45, 60, 100 and 160 cells on the terminal and the desktop: nothing cut, nothing wrapped mid-label, no control rows touching', { timeoutMs: 60_000 }, async ($, on) => {
  world(on)
  await fill($)
  const bad: string[] = []
  for (const surface of SURFACES)
    for (const width of WIDTHS)
      for (const [name, view, act] of VIEWS) {
        const p = await pane($, surface, width, view)
        if (act) await act(p).catch((err: unknown) => bad.push(`${surface} ${width} ${name}: ${String(err)}`))
        await check(p, `${surface} ${width} ${name}`, surface, width, bad)
        // Put a toggled layout bar or sort list back for the next mount.
        if (name === 'bots layout') await p.press({ key: 'lo-done' })
        if (name === 'discover sort open') await p.press({ key: 'sort' })
        await p.unmount()
      }
  expect(bad).toEqual([])
})

test('the band fits 45, 60, 100 and 160 cells with prices, more rows, bots and the list fallback', { timeoutMs: 60_000 }, async ($, on) => {
  world(on)
  await fill($)
  const bad: string[] = []
  for (const surface of SURFACES)
    for (const width of WIDTHS) {
      const b = await band($, surface, width)
      await check(b, `${surface} ${width} band prices`, surface, width, bad)
      if (await b.find({ key: 'band-rows' })) {
        await b.press({ key: 'band-rows' })
        await check(b, `${surface} ${width} band rows`, surface, width, bad)
        await b.press({ key: 'band-rows' })
      }
      await b.press({ key: 'band-view-bots' })
      await check(b, `${surface} ${width} band bots`, surface, width, bad)
      await b.press({ key: 'band-view-prices' })
      await b.unmount()
    }
  expect(bad).toEqual([])
})

test('with no side pane the band holds the list, and it fits at every width', { timeoutMs: 60_000 }, async ($, on) => {
  world(on, false)
  await fill($)
  const bad: string[] = []
  for (const surface of SURFACES)
    for (const width of WIDTHS) {
      const b = await band($, surface, width, 40)
      if ((await b.find({ key: 'sidebar' }))?.props.label !== '✕ List') await b.press({ key: 'sidebar' })
      expect(await b.find({ key: 'search' })).toBeDefined()
      await check(b, `${surface} ${width} band list`, surface, width, bad)
      await b.unmount()
    }
  expect(bad).toEqual([])
})

test('one frame per page while narrow: no card border nests inside the page frame under 72 cells', { timeoutMs: 60_000 }, async ($, on) => {
  world(on)
  await fill($)
  for (const surface of SURFACES)
    for (const width of [45, 60])
      for (const [name, view, act] of VIEWS.filter(v => v[0] !== 'bots layout')) {
        const p = await pane($, surface, width, view)
        if (act) await act(p)
        const tree = (await p.drawn()) as Node
        // The desktop draws the page frame; the terminal's pane is framed by the engine instead.
        expect({ at: `${surface} ${width} ${name}`, frames: frames(tree) }).toEqual({ at: `${surface} ${width} ${name}`, frames: surface === 'desktop' ? 1 : 0 })
        if (name === 'discover sort open') await p.press({ key: 'sort' })
        await p.unmount()
      }
})

test('wide panes keep Discover tight: rows capped, name, numbers and the 24h shape side by side, the star inside', async ($, on) => {
  world(on)
  await fill($)
  for (const surface of SURFACES) {
    const p = await pane($, surface, 160, 'discover')
    for (const [i] of ['list', 'table'].entries()) {
      await p.post({ pick: i }, { in: 'view' })
      const row = (await p.find({ key: i === 0 ? `L-${BONK.id}` : `r-${BONK.id}` }))!
      // A row is a fixed width well inside the pane, so the price sits next to the name.
      expect(typeof row.props.width).toBe('number')
      expect(Number(row.props.width)).toBeLessThanOrEqual(96)
      expect(await p.find({ key: `star-${BONK.id}` })).toBeDefined()
    }
    await p.unmount()
  }
})

test('a pill is one row of padded options with space between, the chosen one a soft highlight, and a click maps to the option under it', async ($, on) => {
  world(on)
  await fill($)
  for (const surface of SURFACES) {
    const p = await pane($, surface, 100, 'trade')
    const client = (await p.find({ key: 'rng' }))!
    const drawn = (await p.drawn({ in: 'rng' })) as Node
    const opts = kids(drawn)
    expect(opts.map(o => textOf(o).trim())).toEqual(['1h', '24h', '7d', '30d'])
    // Padded: each option wider than its label; spaced: a gap between options.
    for (const o of opts) expect(Number(o.props.width)).toBeGreaterThan(cells(textOf(o).trim()))
    expect(num(drawn.props.gap ?? drawn.props.columnGap)).toBeGreaterThanOrEqual(1)
    expect(opts.reduce((a, o) => a + Number(o.props.width), 0) + (opts.length - 1) * num(drawn.props.gap ?? drawn.props.columnGap)).toBe(Number(client.props.width))
    // The chosen option is not a hard gold block: a soft ground with gold text.
    const chosen = opts[1]!
    expect(chosen.props.backgroundColor).not.toBe('#d4bf7c')
    expect(chosen.props.backgroundColor).toBeDefined()
    // A click on the last cell of 30d picks 30d, the 4th option; one on 1h's first cell picks 1h.
    await p.pointer({ type: 'down', x: Number(client.props.width) - 1, y: 0, button: 'left', in: 'rng' })
    expect(((await p.find({ key: 'rng' }))!.props.props as { value: number }).value).toBe(3)
    await p.pointer({ type: 'down', x: 0, y: 0, button: 'left', in: 'rng' })
    expect(((await p.find({ key: 'rng' }))!.props.props as { value: number }).value).toBe(0)
    await p.pointer({ type: 'down', x: 999, y: 0, button: 'left', in: 'rng' })
    await p.pointer({ type: 'down', x: 6, y: 0, button: 'left', in: 'rng' })
    expect(((await p.find({ key: 'rng' }))!.props.props as { value: number }).value).toBe(1)
    await p.unmount()
  }
})

test('chart labels use the app font at a legible size, not tiny monospace', async ($, on) => {
  world(on)
  await fill($)
  const p = await pane($, 'desktop', 100, 'trade')
  const svg = String(((await p.findAll({ type: 'Svg' })) as { props: Record<string, unknown> }[]).find(x => String(x.props.alt).startsWith('price over'))?.props.source)
  expect(svg).toContain('</text>')
  expect(svg).not.toMatch(/monospace/)
  const sizes = [...svg.matchAll(/font-size="([\d.]+)"/g)].map(m => Number(m[1]))
  expect(sizes.length).toBeGreaterThan(0)
  expect(Math.min(...sizes)).toBeGreaterThanOrEqual(11)
  await p.unmount()
})
