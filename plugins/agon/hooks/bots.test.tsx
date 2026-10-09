import { expect, mock, test } from 'claude-code/testing'

import * as PF from './paper-fixtures'
import * as SF from './server-fixtures'
import { applyFill, backoffMs, decide, newBook, pnlOf, recordFill, recordMiss, sliceOf } from './paper-bots'
import type { Bot } from '../types'

const WSOL = 'So11111111111111111111111111111111111111112'
const bot = (over: Partial<Bot> = {}): Bot => ({
  strategy: 'dca',
  mint: WSOL,
  symbol: 'SOL',
  budget: 50,
  p1: 1,
  p2: 5,
  mode: 'copilot',
  cap: 100,
  slip: 20,
  id: 'b1',
  status: 'running',
  created: 0,
  decimals: 9,
  book: newBook(),
  fills: [],
  events: [],
  nextAt: 0,
  retryAt: 0,
  strikes: 0,
  peak: null,
  price: null,
  priceAt: null,
  why: null,
  ...over,
})

// The amounts are the real server's (paper-fixtures.ts): 10 USDC bought 91552862 lamports, and half
// of them sold for 4999996 USDC base units.
test('P&L from fills is exact in base units: average cost, realized on each sell, unrealized at the live price', () => {
  let b = applyFill(newBook(), 'buy', 10_000_000n, 91_552_862n)
  expect(b).toEqual({ spent: '10000000', received: '0', held: '91552862', cost: '10000000', realized: '0', buys: 1, sells: 0 })
  b = applyFill(b, 'sell', 4_999_996n, 45_776_431n)
  // Half the units carry half the cost, 5000000; sold for 4999996, realized is -4 base units.
  expect(b).toEqual({ spent: '10000000', received: '4999996', held: '45776431', cost: '5000000', realized: '-4', buys: 1, sells: 1 })
  const p = pnlOf(b, 9, 109.2, 50)
  expect(p.realized).toBe(-0.000004)
  // 0.045776431 SOL at $109.20 is $4.9987862652, against a cost of $5.
  expect(p.unrealized!.toFixed(10)).toBe('-0.0012137348')
  expect(p.total!.toFixed(10)).toBe('-0.0012177348')
  expect(p.roi!.toFixed(8)).toBe('-0.00243547')
  // The rest sold for 5000010: its cost was the other 5000000, so realized ends at +6, nothing held.
  b = applyFill(b, 'sell', 5_000_010n, 45_776_431n)
  expect(b).toEqual({ spent: '10000000', received: '10000006', held: '0', cost: '0', realized: '6', buys: 1, sells: 2 })
  const flat = pnlOf(b, 9, null, 50)
  expect([flat.realized, flat.unrealized, flat.total, flat.value, flat.roi!.toFixed(6)]).toEqual([0.000006, 0, 0.000006, 0, '0.000012'])
  // Held units with no live price: unrealized and total are unknown, never guessed.
  expect(pnlOf(applyFill(newBook(), 'buy', 10_000_000n, 91_552_862n), 9, null, 50).total).toBeNull()
})

test('DCA slices the budget, never past the cap or what is left, and is done under 1 USDC', () => {
  expect(sliceOf(bot())).toBe(10_000_000n)
  expect(sliceOf(bot({ budget: 500, p2: 3, cap: 100 }))).toBe(100_000_000n)
  expect(sliceOf(bot({ budget: 100, p2: 3 }))).toBe(33_333_333n)
  expect(decide(bot({ nextAt: 60_000 }), 100, 30_000)).toEqual({ kind: 'wait', why: 'next slice in 1 min' })
  expect(decide(bot(), 100, 0)).toEqual({ kind: 'order', side: 'buy', amount: 10_000_000n, why: 'slice 1 of 5' })
  // 99.999999 spent of 100: the last base unit is under the 1 USDC least order, so the bot is done.
  const spent = bot({ budget: 100, p2: 3, book: { ...newBook(), spent: '99999999' } })
  expect(decide(spent, 100, 0)).toEqual({ kind: 'done', why: 'budget spent: $100.00 of $100.00' })
  // A slice over what is left takes only what is left.
  const most = bot({ book: { ...newBook(), spent: '45000000', buys: 4 } })
  expect(decide(most, 100, 0)).toEqual({ kind: 'order', side: 'buy', amount: 5_000_000n, why: 'slice 5 of 5' })
})

test('Trail buys once at min(budget, cap), sells all on the trailing drop or the hard stop, and is done once flat', () => {
  const t = bot({ strategy: 'trail', budget: 500, cap: 100, p1: 6, p2: 10 })
  expect(decide(t, 100, 0)).toEqual({ kind: 'order', side: 'buy', amount: 100_000_000n, why: 'entry' })
  // 1 SOL bought for $100: entry $100, peak $120 seen since.
  const held = { ...t, book: applyFill(newBook(), 'buy', 100_000_000n, 1_000_000_000n), peak: 120 }
  expect(decide(held, 113, 0).kind).toBe('wait')
  expect(decide(held, 112.8, 0)).toEqual({ kind: 'order', side: 'sell', amount: 1_000_000_000n, why: 'trail: $112.80 is 6.0% off the $120.00 peak' })
  // A tight hard stop under entry fires before the trail does.
  const tight = { ...held, p1: 25, p2: 5, peak: 100 }
  expect(decide(tight, 95, 0)).toEqual({ kind: 'order', side: 'sell', amount: 1_000_000_000n, why: 'hard stop: $95.00 is 5.0% under the $100.00 entry' })
  const flat = { ...held, book: applyFill(held.book, 'sell', 113_000_000n, 1_000_000_000n) }
  expect(decide(flat, 90, 0).kind).toBe('done')
})

test('a fill resets the strikes and schedules the next slice; a refusal backs off, and 3 buy refusals pause the bot', () => {
  const f = recordFill(bot(), { side: 'buy', usdc: 10_000_000n, units: 91_552_862n, slot: 454699557, stamp: 'Data slot 1', why: 'slice 1 of 5' }, 30_000, 109.2)
  expect(f.nextAt).toBe(90_000)
  expect(f.fills[0]!.price.toFixed(4)).toBe('109.2265')
  expect(f.status).toBe('running')
  expect([1, 2, 3, 4, 5, 6].map(backoffMs)).toEqual([120_000, 240_000, 480_000, 960_000, 1_800_000, 1_800_000])
  let m = recordMiss(bot(), 'buy', { kind: 'refused', text: 'refused', reasons: [], stamp: null }, 0)
  expect(m.retryAt).toBe(120_000)
  expect(m.strikes).toBe(1)
  expect(decide(m, 100, 60_000)).toEqual({ kind: 'wait', why: 'asks again in 1 min, after 1 refusal' })
  m = recordMiss(m, 'buy', { kind: 'refused', text: 'refused', reasons: [], stamp: null }, 120_000)
  m = recordMiss(m, 'buy', { kind: 'refused', text: 'refused', reasons: [], stamp: null }, 360_000)
  expect(m.status).toBe('paused')
  expect(m.why).toBe('Paused after 3 refusals in a row. Read the last reason, change the bot, then resume it.')
  // A sell that misses never pauses: the position would sit with no stop.
  let s = bot({ strategy: 'trail' })
  for (let i = 0; i < 5; i++) s = recordMiss(s, 'sell', { kind: 'error', text: 'no answer', reasons: [], stamp: null }, 0)
  expect(s.status).toBe('running')
  // Kept bounded: 20 events.
  for (let i = 0; i < 30; i++) s = recordMiss(s, 'sell', { kind: 'error', text: `e${i}`, reasons: [], stamp: null }, 0)
  expect(s.events.length).toBe(20)
  expect(s.events.at(-1)!.text).toBe('e29')
})

// The runner, end to end through the plugin: the Agon server's recorded answers (paper-fixtures.ts),
// Jupiter's price as the test sets it, and the clock moved by the test alone.
const MCP_URL = 'https://agon-dev.onrender.com/mcp'
const USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const T0 = Date.parse('2026-10-09T00:00:00Z')
type Args = { account: string; side: string; inputMint: string; outputMint: string; amount: string }
// A recorded fill with its amounts set to the order's: the shape is the server's own.
const scaled = (fixture: string, inAmount: string, outAmount: string) =>
  fixture.replace(/(inAmount\W+)\d+/, `$1${inAmount}`).replace(/(outAmount\W+)\d+/, `$1${outAmount}`)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const world = (on: any, trade: (a: Args) => string, paper = true) => {
  const clock = mock.clock(on, { now: T0 })
  const store = new Map<string, unknown>([['wallet', PF.PAPER_ACCOUNT]])
  on('store.get', async (_$: unknown, e: { key: string }) => ({ value: store.get(e.key) }))
  on('store.set', async (_$: unknown, e: { key: string; value: unknown }) => {
    store.set(e.key, e.value)
    return { value: undefined }
  })
  on('command.register', async (_$: unknown, e: { name: string }) => ({ value: { command: e.name } }))
  const up = new Set<string>()
  on('ui.open', async (_$: unknown, e: { id: string }) => {
    up.add(e.id)
    return { value: { isPlaced: true } }
  })
  on('ui.panes', async () => ({ value: [...up].map(id => ({ id, title: id, isShown: true, isFocused: true, isPlaced: true })) }))
  on('ui.close', async (_$: unknown, e: { id: string }) => {
    up.delete(e.id)
    return { value: undefined }
  })
  const toasts: string[] = []
  on('ui.toast', async (_$: unknown, e: { text: string }) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  const w = { clock, store, toasts, up, price: 109.2, stale: false, priceCalls: 0, directCalls: 0, trades: [] as Args[] }
  on('http.fetch', async (_$: unknown, e: { url: string; init?: { body?: unknown } }) => {
    const ok = (text: string) => ({ value: { status: 200, ok: true, headers: {}, text } })
    if (e.url === MCP_URL) {
      const body = JSON.parse(String(e.init?.body)) as { method: string; params: { name: string; arguments: Args } }
      if (body.method === 'tools/list') return ok(paper ? PF.LIST : JSON.stringify({ jsonrpc: '2.0', id: 1, result: { tools: [{ name: 'check_trade' }] } }))
      if (body.params.name === 'paper_portfolio') return ok(PF.PORTFOLIO_NEW)
      w.trades.push(body.params.arguments)
      return ok(trade(body.params.arguments))
    }
    // Prices come from the Agon server's /price: its recorded answer, at the price the test sets.
    if (e.url.startsWith('https://agon-dev.onrender.com/price?')) {
      w.priceCalls++
      const body = JSON.parse(SF.PRICE) as { prices: Record<string, { usdPrice: number }> }
      body.prices[WSOL]!.usdPrice = w.price
      // The server's last good price after a failed refresh, flagged as jupiter.ts flags it.
      const stale = w.stale ? { stale: true, ageSeconds: 95, staleReason: 'Prices for 1 mint: Jupiter answered 503 from api.jup.ag. Showing the last good value, fetched 95 s ago.' } : {}
      return ok(JSON.stringify({ ...body, ...stale }))
    }
    if (e.url.includes('/search?query=')) w.directCalls++
    return ok(JSON.stringify([{ id: WSOL, symbol: 'SOL', usdPrice: w.price, decimals: 9 }]))
  })
  return w
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const botsPane = async ($: any, surface: 'terminal' | 'desktop') => {
  const pane = await $.ui.mount({
    plugin: 'agon',
    surface,
    component: 'Pane',
    requestId: 'agon',
    props: { title: 'Agon', isFocused: true, bodyColumns: 100, placement: 'dock', scroll: { offset: 0, bodyRows: 80 } },
  })
  await pane.press({ key: 'nav-bots' })
  return pane
}
const secs = (w: { clock: { now: () => number } }) => (w.clock.now() - T0) / 1000

test('a DCA paper bot places a 10 USDC slice every minute on live prices and stops at its 50 USDC budget', { timeoutMs: 30_000 }, async ($, on) => {
  const w = world(on, a => scaled(PF.BUY_FILLED, a.amount, '91552862'))
  const pane = await botsPane($, 'desktop')
  await pane.press({ key: 'bots-check' })
  await pane.post({ value: 50 }, { in: 'sl-budget' })
  await pane.post({ value: 1 }, { in: 'sl-p1' })
  await pane.post({ value: 5 }, { in: 'sl-p2' })
  await pane.press({ key: 'start' })
  await pane.unmount()
  expect(w.trades.length).toBe(0)
  const at: number[] = []
  for (let i = 0; i < 24; i++) {
    const before = w.trades.length
    await w.clock.advance(30_000)
    if (w.trades.length > before) at.push(secs(w))
  }
  // One slice on the first tick, then one a minute, 5 in all: 50 USDC, and nothing after.
  expect(at).toEqual([30, 90, 150, 210, 270])
  expect(w.trades.every(a => a.side === 'buy' && a.inputMint === USDC && a.outputMint === WSOL && a.amount === '10000000' && a.account === PF.PAPER_ACCOUNT)).toBe(true)
  // One /price call to the Agon server a tick for every bot together, never more, and none to Jupiter.
  expect(w.priceCalls).toBe(24)
  expect(w.directCalls).toBe(0)
  for (const surface of ['terminal', 'desktop'] as const) {
    const p = await botsPane($, surface)
    expect(await p.find({ type: 'Text', text: /^ Paper $/ })).toBeDefined()
    expect(await p.find({ type: 'Text', text: /Demo|sample/i })).toBeUndefined()
    expect(await p.find({ type: 'Text', text: /^done$/ })).toBeDefined()
    // 0.457764310 SOL for $50 at $109.20: $49.99, unrealized -$0.01, realized $0.00.
    expect(await p.find({ type: 'Text', text: /^Spent \$50\.00 of \$50\.00 in 5 fills$/ })).toBeDefined()
    expect(await p.find({ type: 'Text', text: /^Paper P&L -\$0\.01 \(-0\.02% on budget\): realized \$0\.00, unrealized -\$0\.01 at \$109\.20, Jupiter 00:12:00 UTC$/ })).toBeDefined()
    expect(await p.find({ type: 'Text', text: /^Bots trade only while Claude Code is open\. Paper balances reset when the Agon server restarts\. Paper only, no real funds\.$/ })).toBeDefined()
    await p.unmount()
  }
  // Kept across a reload: the bot and its fills are in the store.
  const kept = w.store.get('bots') as { fills: unknown[]; status: string }[]
  expect(kept.length).toBe(1)
  expect(kept[0]!.fills.length).toBe(5)
  expect(kept[0]!.status).toBe('done')
})

test('a price the Agon server could only serve stale places no order, and the bot says why', async ($, on) => {
  const w = world(on, a => scaled(PF.BUY_FILLED, a.amount, '91552862'))
  w.stale = true
  const pane = await botsPane($, 'desktop')
  await pane.press({ key: 'bots-check' })
  await pane.post({ value: 50 }, { in: 'sl-budget' })
  await pane.post({ value: 1 }, { in: 'sl-p1' })
  await pane.post({ value: 5 }, { in: 'sl-p2' })
  await pane.press({ key: 'start' })
  await pane.unmount()
  await w.clock.advance(30_000)
  expect(w.trades.length).toBe(0)
  const p = await botsPane($, 'desktop')
  expect(await p.find({ type: 'Text', text: /No live price this tick \(the Agon server served a stale price \(Prices for 1 mint: Jupiter answered 503/ })).toBeDefined()
  await p.unmount()
  // A fresh price again: the slice goes out on the next tick.
  w.stale = false
  await w.clock.advance(30_000)
  expect(w.trades.length).toBe(1)
})

test('a Trail paper bot buys once, follows the peak and sells everything on the trailing drop', async ($, on) => {
  const w = world(on, a => (a.side === 'buy' ? scaled(PF.BUY_FILLED, a.amount, '457764310') : scaled(PF.SELL_FILLED, a.amount, '51270000')))
  const pane = await botsPane($, 'desktop')
  await pane.press({ key: 'bots-check' })
  await pane.press({ key: 'st-trail' })
  await pane.post({ value: 50 }, { in: 'sl-budget' })
  await pane.post({ value: 6 }, { in: 'sl-p1' })
  await pane.post({ value: 10 }, { in: 'sl-p2' })
  await pane.press({ key: 'start' })
  await pane.unmount()
  await w.clock.advance(30_000)
  expect(w.trades).toEqual([{ account: PF.PAPER_ACCOUNT, side: 'buy', inputMint: USDC, outputMint: WSOL, amount: '50000000' }])
  // Up to $120, then down 5%: still held. Down to $112.80, 6% off the peak: sold, all of it.
  for (const p of [115, 120, 114]) {
    w.price = p
    await w.clock.advance(30_000)
  }
  expect(w.trades.length).toBe(1)
  w.price = 112.8
  await w.clock.advance(30_000)
  expect(w.trades.at(-1)).toEqual({ account: PF.PAPER_ACCOUNT, side: 'sell', inputMint: WSOL, outputMint: USDC, amount: '457764310' })
  w.price = 90
  await w.clock.advance(120_000)
  expect(w.trades.length).toBe(2)
  expect(w.toasts).toContain('Paper Trail SOL: sold 0.45776431 SOL for 51.27 USDC, trail: $112.80 is 6.0% off the $120.00 peak')
  for (const surface of ['terminal', 'desktop'] as const) {
    const p = await botsPane($, surface)
    // Realized: 51.27 for what cost 50, valued at the last price read while it held.
    expect(await p.find({ type: 'Text', text: /^Paper P&L \+\$1\.27 \(\+2\.54% on budget\): realized \+\$1\.27, unrealized \$0\.00 at \$112\.80, Jupiter 00:02:30 UTC$/ })).toBeDefined()
    await p.unmount()
  }
})

test('a refused paper order shows its reason with the number, backs off instead of asking every tick, and pauses after 3', async ($, on) => {
  const w = world(on, () => PF.BUY_REFUSED)
  const pane = await botsPane($, 'desktop')
  await pane.press({ key: 'bots-check' })
  await pane.press({ key: 'start' })
  await pane.unmount()
  for (let i = 0; i < 40; i++) await w.clock.advance(30_000)
  // 20 minutes of ticks, 3 asks: at 0:30, then 2 and 4 minutes later; the third refusal pauses it.
  expect(w.trades.length).toBe(3)
  for (const surface of ['terminal', 'desktop'] as const) {
    const p = await botsPane($, surface)
    expect(await p.find({ type: 'Text', text: /^✗ Price impact 6\.37%, past your 1% band\. Trade smaller\. \(6\.37% against a limit of 1%\)$/ })).toBeDefined()
    expect(await p.find({ type: 'Text', text: /^Paused after 3 refusals in a row\. Read the last reason, change the bot, then resume it\.$/ })).toBeDefined()
    expect(await p.find({ type: 'Text', text: /^Data slot 454699528, rule version / })).toBeDefined()
    await p.unmount()
  }
})

test('with the Agon server not in paper mode, bots cannot start and the view says why and to set AGON_MODE=paper', async ($, on) => {
  const w = world(on, () => PF.BUY_FILLED, false)
  for (const surface of ['terminal', 'desktop'] as const) {
    const pane = await botsPane($, surface)
    await pane.press({ key: 'bots-check' })
    expect(await pane.find({ key: 'start' })).toBeUndefined()
    expect(await pane.find({ type: 'Text', text: /^Bots cannot start: the Agon server at \S+ is not in paper mode\. Run it with AGON_MODE=paper, then press Check again\.$/ })).toBeDefined()
    await pane.unmount()
  }
  await w.clock.advance(120_000)
  expect(w.trades.length).toBe(0)
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const band = ($: any) =>
  $.ui.mount({ plugin: 'agon', surface: 'desktop', component: 'AbovePrompt', props: { hasSurvey: false, isWorking: false, maxRows: 8, bodyColumns: 120 } })

test('the band Bots view has + New bot (+ Make one when empty), which opens the one pane on Bots with the builder shown', async ($, on) => {
  const w = world(on, a => scaled(PF.BUY_FILLED, a.amount, '91552862'))
  const empty = await band($)
  await empty.press({ key: 'band-view-bots' })
  expect(await empty.find({ key: 'band-new-bot' })).toBeUndefined()
  await empty.press({ key: 'band-make-bot' })
  await empty.unmount()
  expect([...w.up]).toEqual(['agon'])
  // The pane opens on Bots with the builder there, without a press on its nav row.
  const pane = await $.ui.mount({
    plugin: 'agon',
    surface: 'desktop',
    component: 'Pane',
    requestId: 'agon',
    props: { title: 'Agon', isFocused: true, bodyColumns: 100, placement: 'dock', scroll: { offset: 0, bodyRows: 80 } },
  })
  expect(await pane.find({ key: 'sl-budget' })).toBeDefined()
  await pane.press({ key: 'bots-check' })
  await pane.press({ key: 'start' })
  // Hidden again, then + New bot (a bot now exists) brings it back.
  await pane.press({ key: 'lay' })
  await pane.post({ toggle: 'builder' }, { in: 'lay-bots' })
  expect(await pane.find({ key: 'sl-budget' })).toBeUndefined()
  await pane.press({ key: 'nav-portfolio' })
  await pane.unmount()
  const one = await band($)
  expect(await one.find({ key: 'band-make-bot' })).toBeUndefined()
  await one.press({ key: 'band-new-bot' })
  await one.unmount()
  const back = await $.ui.mount({
    plugin: 'agon',
    surface: 'desktop',
    component: 'Pane',
    requestId: 'agon',
    props: { title: 'Agon', isFocused: true, bodyColumns: 100, placement: 'dock', scroll: { offset: 0, bodyRows: 80 } },
  })
  expect(await back.find({ key: 'sl-budget' })).toBeDefined()
  expect(await back.find({ key: 'lay-bots' })).toBeDefined()
  await back.unmount()
})

test("the draft rides on the next prompt as model-only context after a change, and while the builder is open", async ($, on) => {
  world(on, () => PF.BUY_FILLED)
  const sent: { text: string; context?: readonly string[] }[] = []
  on('prompt.submit', async (_$, e) => {
    sent.push({ text: e.text, context: e.context })
    return { text: e.text, context: e.context }
  })
  const enter = (text: string) => $.prompt.submit({ text, wait: false, origin: { kind: 'composer' } })
  const pane = await botsPane($, 'desktop')
  await pane.post({ value: 1250 }, { in: 'sl-budget' })
  await pane.unmount()
  await enter('is this sensible?')
  const ctx = sent.at(-1)!.context?.find(c => c.includes('Agon bot draft'))
  expect(ctx).toBeDefined()
  expect(ctx).toContain('strategy DCA')
  expect(ctx).toContain('token SOL (mint So11111111111111111111111111111111111111112)')
  expect(ctx).toContain('budget $1,250 (50 to 5000 USD)')
  expect(ctx).toContain('every 5 min (1 to 60 min)')
  expect(ctx).toContain('orders 8 (2 to 20)')
  expect(ctx).toContain('cap $100 an order (25 to 1000 USD)')
  expect(ctx).toContain('paper mode not checked yet')
  expect(sent.at(-1)!.text).toBe('is this sensible?')
  // Unchanged and with no pane open, the next prompt goes without it.
  await enter('thanks')
  expect(sent.at(-1)!.context).toBeUndefined()
  // While the pane is open on the builder, every prompt carries it.
  const b = await band($)
  await b.press({ key: 'band-view-bots' })
  await b.press({ key: 'band-make-bot' })
  await b.unmount()
  const open = await botsPane($, 'desktop')
  await enter('and now?')
  expect(sent.at(-1)!.context?.some(c => c.includes('Agon bot draft'))).toBe(true)
  await open.unmount()
})

test('bot_draft sets the draft the builder shows, refuses any field out of range changing nothing, and never starts a bot', async ($, on) => {
  const w = world(on, () => PF.BUY_FILLED)
  const call = (input: Record<string, unknown>) => $.tool.call({ tool: 'mcp__agon__bot_draft', ...input } as never)
  const text = (r: unknown) => JSON.stringify(r)
  const set = await call({ strategy: 'trail', budget: 300, trail: 8, stop: 12, cap: 150 })
  expect(text(set)).toContain('strategy Trail')
  expect(text(set)).toContain('trail 8% (1 to 25%)')
  expect(text(set)).toContain('not started')
  const pane = await botsPane($, 'desktop')
  expect(await pane.find({ type: 'Text', text: /^↳ Buy \$150\.00 now, sell all 8% off the peak or 12% under entry$/ })).toBeDefined()
  await pane.unmount()
  const draftNow = text(await call({ action: 'get' }))
  for (const bad of [
    { budget: 99999 },
    { budget: 'abc' },
    { budget: 120.5 },
    { every: 5 },
    { trail: 0 },
    { mint: 'not a mint' },
    { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
    { strategy: 'grid' },
    { action: 'start' },
    { budget: 100, extra: 1 },
  ]) {
    const r = text(await call(bad))
    expect(r).not.toContain('Bot draft now')
    expect(text(await call({ action: 'get' }))).toBe(draftNow)
  }
  expect(text(await call({ budget: 99999 }))).toMatch(/budget.*99999.*50 to 5000/)
  expect(text(await call({ every: 5 }))).toMatch(/every.*DCA.*trail and stop/)
  // Back to DCA with its own parameters; a mint by its address alone, never a name.
  const dca = text(await call({ strategy: 'dca', mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', every: 15, orders: 4 }))
  expect(dca).toContain('token JUP (mint JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN)')
  expect(dca).toContain('every 15 min')
  // It never starts, places or funds a bot.
  const after = await botsPane($, 'desktop')
  expect(await after.find({ type: 'Text', text: /^No bots yet\./ })).toBeDefined()
  await after.unmount()
  expect(w.store.get('bots')).toBeUndefined()
  expect(w.trades.length).toBe(0)
})
