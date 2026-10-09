// The paper bots' rules and books: plain data in, a decision or a new bot out, no network and no
// clock of their own. register.tsx runs them on a timer against live Jupiter prices and sends what
// they decide to the Agon server's paper_trade. Money is in base units, as BigInt.

import type { Bot, BotBook, BotEvent, BotFill } from '../types'

// Thousands grouped in the integer part alone, as a terminal shows money: 1234.5 reads 1,234.5.
export const grouped = (n: string) => n.replace(/^(-?\d+)/, m => m.replace(/\B(?=(\d{3})+$)/g, ','))
// Under half a cent reads $0.00, never -$0.00.
export const usd = (v: number) => `${v <= -0.005 ? '-' : ''}$${grouped(Math.abs(v).toFixed(2))}`

// A bot asks for live prices on this beat, one Jupiter call for every bot's token together.
export const TICK_MS = 30_000
// No order under 1 USDC: what is left of a budget below it is left unspent.
export const MIN_ORDER = 1_000_000n
export const FILLS_KEPT = 50
export const EVENTS_KEPT = 20
// After a refusal or an error the bot waits 2, 4, 8, 16 then 30 minutes before it asks again.
export const backoffMs = (strikes: number) => Math.min(30 * 60_000, 2 * 60_000 * 2 ** Math.max(0, strikes - 1))
// Buys refused this many times in a row pause the bot; a sell never pauses, it keeps its stop.
export const PAUSE_AFTER = 3

const USDC_ONE = 1_000_000n
export const microOf = (dollars: number) => BigInt(Math.round(dollars)) * USDC_ONE
const big = (s: string) => BigInt(s)
const minutes = (ms: number) => Math.max(1, Math.ceil(ms / 60_000))

export const newBook = (): BotBook => ({ spent: '0', received: '0', held: '0', cost: '0', realized: '0', buys: 0, sells: 0 })

// One fill on the books, at average cost: a buy adds its units and what it cost; a sell takes its
// share of the cost off (all of it when it sells all) and realizes what it got against that share.
export function applyFill(b: BotBook, side: 'buy' | 'sell', usdc: bigint, units: bigint): BotBook {
  if (side === 'buy')
    return { ...b, spent: String(big(b.spent) + usdc), held: String(big(b.held) + units), cost: String(big(b.cost) + usdc), buys: b.buys + 1 }
  const held = big(b.held)
  const q = units > held ? held : units
  const off = held > 0n ? (big(b.cost) * q) / held : 0n
  return {
    ...b,
    received: String(big(b.received) + usdc),
    held: String(held - q),
    cost: String(big(b.cost) - off),
    realized: String(big(b.realized) + usdc - off),
    sells: b.sells + 1,
  }
}

// USDC per whole token, from base units.
export const priceOf = (usdc: bigint, units: bigint, decimals: number) => (units > 0n ? Number(usdc) / 1e6 / (Number(units) / 10 ** decimals) : 0)

// The books valued at a live price: realized is exact, unrealized is what is held at that price
// against its cost. With units held and no price, unrealized and total are unknown (null).
export function pnlOf(b: BotBook, decimals: number, price: number | null, budget: number) {
  const realized = Number(big(b.realized)) / 1e6
  const held = big(b.held)
  const value = held === 0n ? 0 : price == null ? null : (Number(held) / 10 ** decimals) * price
  const unrealized = value == null ? null : held === 0n ? 0 : value - Number(big(b.cost)) / 1e6
  const total = unrealized == null ? null : realized + unrealized
  return { realized, unrealized, total, roi: total == null || budget <= 0 ? null : (total / budget) * 100, value }
}

// A DCA slice: the budget over the orders, never past the cap.
export const sliceOf = (b: Bot) => {
  const even = microOf(b.budget) / BigInt(Math.max(1, b.p2))
  const cap = microOf(b.cap)
  return even < cap ? even : cap
}

export type Decision = { kind: 'order'; side: 'buy' | 'sell'; amount: bigint; why: string } | { kind: 'wait'; why: string } | { kind: 'done'; why: string }

// What the rule says at this price and time. Pure arithmetic on the bot's own books.
export function decide(b: Bot, price: number, now: number): Decision {
  const held = big(b.book.held)
  if (b.strategy === 'dca') {
    const budget = microOf(b.budget)
    const left = budget - big(b.book.spent)
    if (left < MIN_ORDER) return { kind: 'done', why: `budget spent: ${usd(Number(big(b.book.spent)) / 1e6)} of ${usd(b.budget)}` }
    if (now < b.retryAt) return { kind: 'wait', why: waitWords(b, now) }
    if (now < b.nextAt) return { kind: 'wait', why: `next slice in ${minutes(b.nextAt - now)} min` }
    const slice = sliceOf(b)
    const of = Number((budget + slice - 1n) / slice)
    return { kind: 'order', side: 'buy', amount: left < slice ? left : slice, why: `slice ${b.book.buys + 1} of ${of}` }
  }
  if (held === 0n && b.book.buys > 0) return { kind: 'done', why: 'sold out after its exit' }
  if (now < b.retryAt) return { kind: 'wait', why: waitWords(b, now) }
  if (held === 0n) {
    const budget = microOf(b.budget)
    const cap = microOf(b.cap)
    return { kind: 'order', side: 'buy', amount: budget < cap ? budget : cap, why: 'entry' }
  }
  const entry = priceOf(big(b.book.cost), held, b.decimals)
  const peak = Math.max(b.peak ?? price, price)
  if (price <= (entry * (100 - b.p2)) / 100)
    return { kind: 'order', side: 'sell', amount: held, why: `hard stop: ${usd(price)} is ${((1 - price / entry) * 100).toFixed(1)}% under the ${usd(entry)} entry` }
  if (price <= (peak * (100 - b.p1)) / 100)
    return { kind: 'order', side: 'sell', amount: held, why: `trail: ${usd(price)} is ${((1 - price / peak) * 100).toFixed(1)}% off the ${usd(peak)} peak` }
  return { kind: 'wait', why: `holding; exits at ${usd(Math.max((peak * (100 - b.p1)) / 100, (entry * (100 - b.p2)) / 100))}` }
}

const waitWords = (b: Bot, now: number) => `asks again in ${minutes(b.retryAt - now)} min, after ${b.strikes} ${b.strikes === 1 ? 'refusal' : 'refusals'}`

// A fill the server recorded, on the bot: its books, its last fills, the next slice's time, the peak
// a trail starts from, and done once the rule has nothing left to do.
export function recordFill(
  b: Bot,
  f: { side: 'buy' | 'sell'; usdc: bigint; units: bigint; slot: number | null; stamp: string; why: string },
  now: number,
  price: number,
): Bot {
  const book = applyFill(b.book, f.side, f.usdc, f.units)
  const fill: BotFill = { at: now, side: f.side, usdc: String(f.usdc), units: String(f.units), price: priceOf(f.usdc, f.units, b.decimals), slot: f.slot, stamp: f.stamp, why: f.why }
  const next: Bot = { ...b, book, fills: [...b.fills, fill].slice(-FILLS_KEPT), strikes: 0, retryAt: 0, why: null, nextAt: now + b.p1 * 60_000 }
  if (b.strategy === 'trail') next.peak = f.side === 'buy' ? price : null
  const done = b.strategy === 'dca' ? microOf(b.budget) - big(book.spent) < MIN_ORDER : f.side === 'sell' && big(book.held) === 0n
  return done ? { ...next, status: 'done' } : next
}

// A refusal or an error: kept with its reasons, and the bot waits longer each time before it asks
// again. Buys refused PAUSE_AFTER times in a row pause it, with why.
export function recordMiss(b: Bot, side: 'buy' | 'sell', ev: Omit<BotEvent, 'at'>, now: number): Bot {
  const strikes = b.strikes + 1
  const next: Bot = { ...b, events: [...b.events, { ...ev, at: now }].slice(-EVENTS_KEPT), strikes, retryAt: now + backoffMs(strikes) }
  return side === 'buy' && strikes >= PAUSE_AFTER
    ? { ...next, status: 'paused', why: `Paused after ${strikes} refusals in a row. Read the last reason, change the bot, then resume it.` }
    : next
}

// A bot read back from the store, checked field by field; anything else (an old demo bot) is dropped.
const isDigits = (v: unknown, signed = false) => typeof v === 'string' && (signed ? /^-?\d{1,30}$/ : /^\d{1,30}$/).test(v)
const isNum = (v: unknown) => typeof v === 'number' && Number.isFinite(v)
export function isBot(v: unknown): v is Bot {
  if (typeof v !== 'object' || v === null) return false
  const b = v as Record<string, unknown>
  const book = b.book as Record<string, unknown> | undefined
  return (
    (b.strategy === 'dca' || b.strategy === 'trail') &&
    typeof b.id === 'string' &&
    typeof b.mint === 'string' &&
    /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(b.mint) &&
    typeof b.symbol === 'string' &&
    (b.status === 'running' || b.status === 'paused' || b.status === 'done') &&
    [b.budget, b.p1, b.p2, b.cap, b.created, b.decimals, b.nextAt, b.retryAt, b.strikes].every(isNum) &&
    typeof book === 'object' &&
    book !== null &&
    isDigits(book.spent) &&
    isDigits(book.received) &&
    isDigits(book.held) &&
    isDigits(book.cost) &&
    isDigits(book.realized, true) &&
    isNum(book.buys) &&
    isNum(book.sells) &&
    Array.isArray(b.fills) &&
    Array.isArray(b.events)
  )
}
