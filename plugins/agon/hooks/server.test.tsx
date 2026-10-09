import { expect, mock, test } from 'claude-code/testing'

import * as SF from './server-fixtures'

// Market data through the Agon server's cached routes (agon-dev T-C53), replayed from the bodies the
// running server answered (server-fixtures.ts), with Jupiter's direct answers as the fallback.
const SERVER = 'https://agon-dev.onrender.com'
const SOL = 'So11111111111111111111111111111111111111112'
const JUP = 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'
const BONK = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'
const USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
// Jupiter's own answer, for Discover's list (only Jupiter sends it) and for the fallback: the 3
// watched tokens at prices the server never sent, so a price on screen says which path it took.
const JUP_LIST = JSON.stringify([
  { id: SOL, symbol: 'SOL', usdPrice: 50, stats24h: { priceChange: 1.5 }, decimals: 9 },
  { id: JUP, symbol: 'JUP', usdPrice: 0.5, decimals: 6 },
  { id: BONK, symbol: 'Bonk', usdPrice: 0.00001, decimals: 5 },
])
// The recorded /tokens with every price set to 99: the band's prices can then only come from /price.
const TOKENS_AT_99 = (() => {
  const b = JSON.parse(SF.TOKENS) as { tokens: { price: { value: number } }[] }
  for (const t of b.tokens) t.price.value = 99
  return JSON.stringify(b)
})()

type Res = { value: { status: number; ok: boolean; headers: Record<string, string>; text: string } }
const res = (status: number, text: string, headers: Record<string, string> = {}): Res => ({ value: { status, ok: status >= 200 && status < 300, headers, text } })
// Every call the plugin makes, by kind; `server` answers the Agon server's routes, or throws for one
// that is down. Jupiter's market reads (search by mint, price, quote) are counted apart from the list.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const world = (on: any, server: (url: string) => Res) => {
  const w = { server: [] as string[], jupMarket: [] as string[], jupList: [] as string[] }
  on('command.register', async (_$: unknown, e: { name: string }) => ({ value: { command: e.name } }))
  on('ui.open', async () => ({ value: { isPlaced: true } }))
  on('http.fetch', async (_$: unknown, e: { url: string }) => {
    if (e.url.startsWith(`${SERVER}/`) && !e.url.startsWith(`${SERVER}/mcp`)) {
      w.server.push(e.url)
      return server(e.url)
    }
    if (/jup\.ag\//.test(e.url)) {
      if (/\/search\?query=|\/price\/|\/quote\?/.test(e.url)) w.jupMarket.push(e.url)
      else w.jupList.push(e.url)
      return res(200, JUP_LIST)
    }
    return res(200, '[]')
  })
  return w
}
const ids = (url: string) => (new URL(url).searchParams.get('ids') ?? '').split(',')
const routeOf = (url: string) => new URL(url).pathname
const PANE = (surface: 'terminal' | 'desktop', bodyColumns = 100) =>
  ({
    plugin: 'agon',
    surface,
    component: 'Pane',
    requestId: 'agon',
    props: { title: 'Agon', isFocused: true, bodyColumns, placement: 'dock', scroll: { offset: 0, bodyRows: 80 } },
  }) as const
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const open = async ($: any, view: 'discover' | 'watch' | 'trade', surface: 'terminal' | 'desktop' = 'desktop') => {
  const pane = await $.ui.mount(PANE(surface))
  await pane.press({ key: `nav-${view}` })
  return pane
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const band = ($: any, bodyColumns = 160) =>
  $.ui.mount({ plugin: 'agon', surface: 'terminal', component: 'AbovePrompt', props: { hasSurvey: false, isWorking: false, maxRows: 6, bodyColumns } })
// Loading Discover's list refreshes the watchlist and polls its prices, as the 20 s timer does.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const refresh = async ($: any) => {
  const pane = await open($, 'discover')
  await pane.post({ pick: 0 }, { in: 'src' })
  await pane.unmount()
}

test('the band prices the watchlist from 1 /price call to the Agon server and says so, small', async ($, on) => {
  const w = world(on, url => (routeOf(url) === '/price' ? res(200, SF.PRICE) : routeOf(url) === '/tokens' ? res(200, TOKENS_AT_99) : res(404, '{}')))
  await refresh($)
  // 1 /price call holds all 3 watched mints; nothing is asked of Jupiter for them.
  const priceCalls = w.server.filter(u => routeOf(u) === '/price')
  expect(priceCalls.length).toBe(1)
  expect(ids(priceCalls[0]!).sort()).toEqual([BONK, JUP, SOL].sort())
  expect(w.jupMarket).toEqual([])

  // SOL at $110.52 and -3.9% are the recorded /price answer; /tokens said $99.
  const b = await band($)
  expect(await b.find({ type: 'Text', text: /^SOL \$110\.52$/ })).toBeDefined()
  expect(await b.find({ type: 'Text', text: /^▼3\.9%$/ })).toBeDefined()
  expect(await b.find({ type: 'Text', text: /\$99\.00/ })).toBeUndefined()
  expect(await b.find({ type: 'Text', text: /^via Agon, \d+ s ago$/ })).toBeDefined()
  await b.unmount()

  // The watchlist names the server and the host it read, with the age.
  const pane = await open($, 'watch')
  expect(await pane.find({ type: 'Text', text: /^Prices via Agon server from api\.jup\.ag, \d+ s ago$/ })).toBeDefined()
  await pane.unmount()
})

test('with the Agon server down or answering 5xx, prices come straight from Jupiter, and the server is asked again after 30 s', async ($, on) => {
  const clock = mock.clock(on, { now: Date.parse('2026-10-09T00:00:00Z') })
  let answer: 'down' | '503' = 'down'
  const w = world(on, () => {
    if (answer === 'down') throw new Error('connect ECONNREFUSED 127.0.0.1:8787')
    return res(503, JSON.stringify({ error: 'Service Unavailable' }))
  })
  await refresh($)
  // Each route asked the server once; the rest of the refresh went to Jupiter without asking it again.
  const asked = w.server.length
  expect(new Set(w.server.map(routeOf)).size).toBe(asked)
  expect(w.server.map(routeOf)).toContain('/price')
  expect(w.jupMarket.length).toBeGreaterThan(0)
  const b = await band($)
  expect(await b.find({ type: 'Text', text: /^SOL \$50\.00$/ })).toBeDefined()
  expect(await b.find({ type: 'Text', text: /^direct from Jupiter$/ })).toBeDefined()
  await b.unmount()
  // The test's throw reaches the plugin as the engine's own failure text, so the cause is matched loosely.
  let pane = await open($, 'watch')
  expect(await pane.find({ type: 'Text', text: /^Prices direct from Jupiter \(lite-api\.jup\.ag\), since nothing answers at https:\/\/agon-dev\.onrender\.com \(.+\)$/ })).toBeDefined()
  await pane.unmount()

  // Within 30 s the server is left alone; after, it is asked again, and a 503 falls back the same way.
  await clock.advance(10_000)
  await refresh($)
  expect(w.server.length).toBe(asked)
  answer = '503'
  await clock.advance(21_000)
  await refresh($)
  expect(w.server.length).toBeGreaterThan(asked)
  pane = await open($, 'watch')
  expect(await pane.find({ type: 'Text', text: /^Prices direct from Jupiter \(lite-api\.jup\.ag\), since the Agon server at https:\/\/agon-dev\.onrender\.com answered 503 \(Service Unavailable\)$/ })).toBeDefined()
  await pane.unmount()
})

test("a 429 from the Agon server is waited out for its Retry-After, asking neither it nor Jupiter meanwhile", async ($, on) => {
  const clock = mock.clock(on, { now: Date.parse('2026-10-09T00:00:00Z') })
  let busy = true
  const w = world(on, url => (busy ? res(429, SF.SERVER_BUSY, { 'retry-after': '20' }) : routeOf(url) === '/price' ? res(200, SF.PRICE) : res(200, SF.TOKENS)))
  await refresh($)
  expect(w.server.length).toBe(1)
  expect(w.jupMarket).toEqual([])
  // The band leaves the prices out; the watchlist says why, with the wait.
  const b = await band($)
  expect(await b.find({ key: 'band-prices' })).toBeUndefined()
  await b.unmount()
  const pane = await open($, 'watch')
  expect(
    await pane.find({
      type: 'Text',
      text: /^Prices not updated: the Agon server is over its 120 requests a minute and asked for 20 s of quiet, so nothing is asked of it or of Jupiter until then$/,
    }),
  ).toBeDefined()
  await pane.unmount()

  // 19 s on, still waiting: not 1 call to the server or to Jupiter's market reads.
  busy = false
  await clock.advance(19_000)
  await refresh($)
  expect(w.server.length).toBe(1)
  expect(w.jupMarket).toEqual([])

  // Past the 20 s, the server is asked again and the prices come back through it.
  await clock.advance(2_000)
  await refresh($)
  expect(w.server.length).toBeGreaterThan(1)
  expect(w.jupMarket).toEqual([])
  const back = await band($)
  expect(await back.find({ type: 'Text', text: /^SOL \$110\.52$/ })).toBeDefined()
  await back.unmount()
})

test('the order book reads its 8 quotes from /quote, names a size with no route, and asks Jupiter nothing', async ($, on) => {
  // The recorded quotes, their amounts scaled to the size asked, as the server would answer them.
  const scaled = (fixture: string, amount: bigint) => {
    const q = JSON.parse(fixture) as { inAmount: string; outAmount: string }
    return JSON.stringify({ ...q, inAmount: amount.toString(), outAmount: ((BigInt(q.outAmount) * amount) / BigInt(q.inAmount)).toString() })
  }
  const w = world(on, url => {
    const q = new URL(url).searchParams
    if (routeOf(url) === '/price') return res(200, SF.PRICE)
    if (routeOf(url) === '/tokens') return res(200, SF.TOKENS)
    if (routeOf(url) === '/candles') return res(200, SF.CANDLES)
    if (routeOf(url) !== '/quote') return res(404, '{}')
    const amount = BigInt(q.get('amount')!)
    if (q.get('inputMint') === USDC) return amount === 25_000_000_000n ? res(502, SF.QUOTE_NO_ROUTE) : res(200, scaled(SF.QUOTE_BUY, amount))
    return res(200, scaled(SF.QUOTE_SELL, amount))
  })
  await refresh($)
  const trade = await open($, 'trade')
  const before = w.server.length
  await trade.press({ key: 'depth-refresh' })
  const quotes = w.server.slice(before).filter(u => routeOf(u) === '/quote')
  expect(quotes.length).toBe(8)
  expect(w.jupMarket).toEqual([])
  // $100 of SOL bought at the recorded 904,495,681 lamports: $110.56; the server's price as the mid.
  expect(await trade.find({ type: 'Text', text: /^\$110\.56$/ })).toBeDefined()
  expect(await trade.find({ type: 'Text', text: /^Jupiter price \$110\.52$/ })).toBeDefined()
  // The $25,000 buy the server answered 502 "Jupiter answered 400" is a missing route, not an error.
  expect(await trade.find({ type: 'Text', text: /^no route$/ })).toBeDefined()
  expect(await trade.find({ type: 'Text', text: /^! Depth not read/ })).toBeUndefined()
  expect(await trade.find({ type: 'Text', text: /^Quotes via Agon server from api\.jup\.ag, \d+ s ago; read again every 10 s at most while this view is open$/ })).toBeDefined()
  await trade.unmount()
})
