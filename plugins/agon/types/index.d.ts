// A token as the band and pane draw it. Only `mint` ever reaches the model, in a draft the person
// sends; the symbol is outside text and is shown to the person alone.
export type Tok = {
  mint: string
  symbol: string
  icon: string | null
  price: number | null
  change5m: number | null
  change1h: number | null
  change6h: number | null
  change24h: number | null
  volume24h: number | null
  mcap: number | null
  liquidity: number | null
  holders: number | null
  organic: number | null
  mintOff: boolean | null
  freezeOff: boolean | null
  decimals: number | null
}

// The vault line, as list_rules answered it, and when.
// `text` fits the band's 28 cells; `detail` is the whole of a failure, shown once as a toast.
export type Vault = { text: string; ok: boolean; at: number; detail?: string }

// How much of the band shows: its name only, the prices line, or the token list too.
export type BandMode = 'collapsed' | 'line' | 'list'

// The selected token's price history: closes oldest first, or why there is none.
export type Chart = {
  key: string
  closes: number[]
  volumes: number[]
  times: number[]
  error: string | null
}

// A paper bot: its rules, and what it did on the Agon server's paper ledger at live Jupiter prices.
// DCA buys a USDC slice every `p1` minutes, `p2` slices in all; Trail buys once, then sells all it
// holds `p1`% off the peak or `p2`% under its entry, whichever comes first. No order is larger than
// `cap` USDC, and the buys together never pass `budget`.
export type BotStrategy = 'dca' | 'trail'
export type BotDraft = {
  strategy: BotStrategy
  mint: string
  symbol: string
  budget: number
  p1: number
  p2: number
  mode: 'copilot' | 'auto'
  cap: number
  slip?: number
}
// One paper fill as paper_trade recorded it: `usdc` in USDC base units (6 decimals) and `units` in
// the token's base units, digit strings; `price` is USDC per whole token at that fill.
export type BotFill = { at: number; side: 'buy' | 'sell'; usdc: string; units: string; price: number; slot: number | null; stamp: string; why: string }
// A refusal or an error, kept with its reasons and the time the bot asks again.
export type BotEvent = { at: number; kind: 'refused' | 'error'; text: string; reasons: PaperReason[]; stamp: string | null }
// The bot's books, exact, as digit strings (realized may be negative): USDC spent on buys and got
// from sells, the token units held, their cost at average cost, and realized P&L, in base units.
export type BotBook = { spent: string; received: string; held: string; cost: string; realized: string; buys: number; sells: number }
export type Bot = BotDraft & {
  id: string
  status: 'running' | 'paused' | 'done'
  created: number
  decimals: number
  book: BotBook
  fills: BotFill[]
  events: BotEvent[]
  nextAt: number
  retryAt: number
  strikes: number
  peak: number | null
  price: number | null
  priceAt: number | null
  why: string | null
}

// The selected token's order book as Jupiter quotes measure it: at each size, the price buying
// (ask) and selling (bid) would get, the token amount, and the impact against Jupiter's price.
export type DepthLevel = { side: 'ask' | 'bid'; usd: number; price: number | null; amount: number | null; impact: number | null }
export type Depth = { mint: string; at: number; mid: number; quote: string; levels: DepthLevel[]; error: string | null; src?: Src | null }

// Where market data came from: the Agon server's cached routes ('agon', `host` the upstream it read)
// or straight from Jupiter or GeckoTerminal while the server is down ('direct'). `at` is when the
// upstream answered (ms), `stale` the server's reason when it served its last good value, `why` why
// the server was not used.
export type Src = { via: 'agon' | 'direct'; host: string; at: number; stale: string | null; why: string | null }
// One mint's live price, as the last price poll read it.
export type Live = { price: number; change24h: number | null; liquidity: number | null; decimals: number | null }
// The last price poll: its prices, where they came from, and why the newest poll failed, if it did.
export type PriceFeed = { prices: Record<string, Live>; src: Src | null; error: string | null }

// The saved wallet's holdings as Jupiter's holdings endpoint lists them (amounts in whole tokens),
// with Jupiter's prices for them; `wallet` is null when none is saved.
export type Holding = { mint: string; amount: number }
export type Portfolio = { wallet: string | null; at: number; sol: number; holdings: Holding[]; tokens: Tok[]; skipped: number; error: string | null }

// Where a pane's sections sit: the main lane and the side lane, side by side once the pane is wide
// and the side lane on top when it is narrow, the hidden ones, and the density. Kept across sessions.
export type PaneLayout = { main: string[]; side: string[]; hidden: string[]; dense: boolean }

// A paper order as the Trade tab builds it: a buy spending `usdc` USDC, or a sell of `pct` percent of
// the paper holding for USDC. `symbol` is shown to the person alone and never sent.
// A sell names its amount either as a percent of the holding or as exact base units (`base`), worked out
// from a USDC value at the live price.
export type PaperOrder = { side: 'buy' | 'sell'; mint: string; symbol: string; usdc: number | null; pct: number | null; base?: string | null }
// One reason from the guard's verdict, as the server's paper_trade returns it.
export type PaperReason = { rule: string; message: string; observed?: number; limit?: number; unit?: string }
// What the last paper order came to: filled, refused by check_trade (with its reasons), or not placed.
// `stamp` is the verdict's data slot and rule version, null when no verdict came back.
export type PaperLast = { ok: boolean; text: string; reasons: PaperReason[]; stamp: string | null }
// The server's paper ledger, as paper_portfolio returns it. Amounts are base units as digit strings;
// USDC values are decimal strings, `valueUsdc` null when no quote priced that holding.
export type PaperFill = { at: string; side: 'buy' | 'sell'; inputMint: string; outputMint: string; inAmount: string; outAmount: string; quoteSlot: number | null }
// `cost` (T-C58): what the holding cost in USDC and its P&L against that, or why no cost is recorded.
// Absent on USDC and on a server from before costs were kept.
export type PaperCost = { costUsdc: string; pnlUsdc: string | null; pnlPct: number | null } | { costWhy: string }
export type PaperHolding = { mint: string; amount: string; valueUsdc: string | null; why?: string; cost?: PaperCost }
export type PaperBook = {
  account: string
  startedWithUsdc: string
  valueUsdc: string
  pnlUsdc: string
  pnlPct: number
  /** USDC added by paper_deposit, so a deposit is never read as a gain. */
  depositedUsdc: string
  unpriced: number
  priceSource: string
  pricedAt: string
  holdings: PaperHolding[]
  fills: PaperFill[]
  fillCount: number
  note: string
}
// Paper trading on the Agon server, as the plugin's adapter reads it: 'on' once the server lists its
// paper trade tool. `reason` says why it is off; `note` is the server's own paper note.
export type Paper = {
  status: 'unknown' | 'off' | 'on'
  at: number
  reason: string | null
  last: PaperLast | null
  portfolio: PaperBook | null
  portfolioError: string | null
  note: string | null
}

declare module 'claude-code' {
  interface PluginState {
    agon: {
      tokens: Tok[]
      watch: Tok[]
      listError: string | null
      vault: Vault | null
      selected: string | null
      mode: BandMode
      logos: Record<string, string>
      pixels: Record<string, string>
      paneNote: string | null
      cardMenu: string | null
      sidebarUp: boolean
      source: number
      interval: number
      sort: number
      query: string
      range: number
      chart: Chart | null
      charts: Record<string, { closes: number[]; times: number[]; at: number }>
      desc: boolean
      audited: boolean
      view: 'list' | 'table' | 'cards'
      paneView: 'start' | 'discover' | 'watch' | 'trade' | 'bots' | 'portfolio'
      sortOpen: boolean
      bots: Bot[]
      botDraft: BotDraft | null
      botSel: string | null
      layouts: Record<string, PaneLayout>
      layoutEdit: string | null
      watchlist: string[]
      tradeAmt: number
      tradePct: number
      bandPage: number
      bandRows: number
      bandView: 'prices' | 'bots'
      search: { query: string; tokens: Tok[]; error: string | null; done: boolean } | null
      picked: Tok | null
      portfolio: Portfolio | null
      portMode: 'paper' | 'mainnet'
      portSpan: number
      portKind: 'value' | 'pnl' | 'pie'
      fillsOpen: boolean
      paperSide: 'buy' | 'sell'
      paperAmt: string
      paperPreset: { pct: number; text: string; side: 'buy' | 'sell' } | null
      infoOpen: string | null
      depth: Depth | null
      priceFeed: PriceFeed | null
      paper: Paper | null
      paperPending: PaperOrder | null
      paperUsdc: number
      recent: string[]
      startNote: { text: string; ok: boolean } | null
      startDraft: string
    }
  }
}
