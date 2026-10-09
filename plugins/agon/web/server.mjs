// The Agon bots page server. Serves bots.html from one folder, and holds a WebSocket at /ws that
// pushes the page the moment the plugin rewrites it, plus Jupiter prices for the mints an open page
// shows, every 2 s while one is open. Local only: 127.0.0.1, its own Host and Origin, one file.
import { createServer } from 'node:http'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { mkdirSync, readFileSync, watch } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const PORT = Number(process.env.PORT ?? 8765)
const ROOT = process.argv[2] ?? join(process.env.TEMP ?? process.env.TMPDIR ?? '/tmp', 'agon-web')
const PAGE = join(ROOT, 'bots.html')
const HOSTS = new Set([`127.0.0.1:${PORT}`, `localhost:${PORT}`])
const ORIGINS = new Set([...HOSTS].map(h => `http://${h}`))
const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
const PRICES = 'https://lite-api.jup.ag/price/v3?ids='
// Jupiter keys, one per line in ~/.agon/jupiter-keys, outside every repository, read once and never
// shown. Each poll takes the next key in turn and moves on after a 429 or a refused key; with no
// keys, or every key refused, the keyless endpoint as before.
const KEYS = (() => {
  try {
    const lines = readFileSync(join(homedir(), '.agon', 'jupiter-keys'), 'utf8').split(/\r?\n/)
    return [...new Set(lines.map(l => l.trim()).filter(l => /^jup_[0-9a-f]{64}$/.test(l)))]
  } catch {
    return []
  }
})()
let turn = 0
async function prices(ids) {
  let last = null
  for (let i = 0; i < KEYS.length; i++) {
    last = await fetch(`https://api.jup.ag/price/v3?ids=${ids}`, { headers: { 'x-api-key': KEYS[turn++ % KEYS.length] }, signal: AbortSignal.timeout(5000) })
    if (![401, 403, 429].includes(last.status)) return last
  }
  return last?.status === 429 ? last : fetch(PRICES + ids, { signal: AbortSignal.timeout(5000) })
}
const clients = new Set()

mkdirSync(ROOT, { recursive: true })

// HTTP: the page alone, and only to a Host this machine names, so a rebound DNS name reads nothing.
const server = createServer(async (req, res) => {
  if (!HOSTS.has(req.headers.host ?? '')) return void res.writeHead(421).end('Wrong host')
  const path = new URL(req.url ?? '/', 'http://local').pathname
  if (path === '/') return void res.writeHead(302, { location: '/bots.html' }).end()
  if (path !== '/bots.html') return void res.writeHead(404).end('Not found')
  try {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }).end(await readFile(PAGE))
  } catch {
    res
      .writeHead(503, { 'content-type': 'text/plain; charset=utf-8' })
      .end('The bots page is not written yet. Open Claude Code with the Agon plugin; it writes the page within 3 seconds.')
  }
})

// A server frame: unmasked, final, one opcode.
const frame = (op, payload) => {
  const n = payload.length
  let head
  if (n < 126) head = Buffer.from([0x80 | op, n])
  else if (n < 65536) head = Buffer.from([0x80 | op, 126, n >> 8, n & 255])
  else {
    head = Buffer.alloc(10)
    head[0] = 0x80 | op
    head[1] = 127
    head.writeBigUInt64BE(BigInt(n), 2)
  }
  return Buffer.concat([head, payload])
}
const send = (c, msg) => {
  if (!c.socket.destroyed) c.socket.write(frame(1, Buffer.from(JSON.stringify(msg))))
}
const broadcast = msg => {
  for (const c of clients) send(c, msg)
}
const close = c => {
  clients.delete(c)
  if (!c.socket.destroyed) c.socket.end(frame(8, Buffer.alloc(0)))
}

// The page may say which mints it shows (well-formed, at most 30) and ask for a round trip.
const onMessage = (c, text) => {
  let m
  try {
    m = JSON.parse(text)
  } catch {
    return
  }
  if (m?.type === 'sub' && Array.isArray(m.mints)) {
    c.mints = new Set(m.mints.filter(x => typeof x === 'string' && BASE58.test(x)).slice(0, 30))
    void pollPrices()
  } else if (m?.type === 'ping' && typeof m.t === 'number') send(c, { type: 'pong', t: m.t })
}

// A page's frames are masked, whole and small: anything else closes the socket rather than buffering.
const onData = (c, chunk) => {
  c.buf = Buffer.concat([c.buf, chunk])
  while (c.buf.length >= 2) {
    const fin = c.buf[0] & 0x80
    const op = c.buf[0] & 0x0f
    const masked = c.buf[1] & 0x80
    let n = c.buf[1] & 0x7f
    let at = 2
    if (n === 126) {
      if (c.buf.length < 4) return
      n = c.buf.readUInt16BE(2)
      at = 4
    } else if (n === 127) return close(c)
    if (!fin || !masked || n > 4096) return close(c)
    if (c.buf.length < at + 4 + n) return
    const mask = c.buf.subarray(at, at + 4)
    const data = Buffer.from(c.buf.subarray(at + 4, at + 4 + n))
    for (let i = 0; i < data.length; i++) data[i] ^= mask[i & 3]
    c.buf = c.buf.subarray(at + 4 + n)
    if (op === 8) return close(c)
    if (op === 9) c.socket.write(frame(10, data))
    else if (op === 1) onMessage(c, data.toString('utf8'))
  }
}

server.on('upgrade', async (req, socket) => {
  const key = req.headers['sec-websocket-key']
  const path = new URL(req.url ?? '/', 'http://local').pathname
  // Only this page's own origin may open the socket: another site in the same browser cannot.
  if (path !== '/ws' || !HOSTS.has(req.headers.host ?? '') || !ORIGINS.has(req.headers.origin ?? '') || typeof key !== 'string') {
    socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n')
    return
  }
  const accept = createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64')
  socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`)
  const c = { socket, mints: new Set(), buf: Buffer.alloc(0) }
  clients.add(c)
  socket.on('data', chunk => onData(c, chunk))
  socket.on('close', () => clients.delete(c))
  socket.on('error', () => clients.delete(c))
  try {
    send(c, { type: 'page', html: await readFile(PAGE, 'utf8') })
  } catch {
    // Not written yet: the next write is pushed when it lands.
  }
})

// The plugin rewrites the page on every bot tick; each write is pushed at once, a burst only once.
let pending = null
watch(ROOT, (_, file) => {
  if (file !== 'bots.html' || pending) return
  pending = setTimeout(async () => {
    pending = null
    try {
      broadcast({ type: 'page', html: await readFile(PAGE, 'utf8') })
    } catch {
      // Mid-write: the write that follows is pushed instead.
    }
  }, 120)
})

// Jupiter's prices for every mint an open page shows, every 2 s while one is open: 30 calls a
// minute at most. A refusal is said to the pages and waited out, never retried at once.
let polling = false
let restUntil = 0
async function pollPrices() {
  if (polling || Date.now() < restUntil) return
  const mints = [...new Set([...clients].flatMap(c => [...c.mints]))].slice(0, 50)
  if (mints.length === 0) return
  polling = true
  try {
    const res = await prices(mints.join(','))
    if (res.status === 429) {
      restUntil = Date.now() + 15_000
      broadcast({ type: 'status', text: 'Jupiter answered 429, its rate limit. Live prices resume in 15 s.' })
      return
    }
    if (!res.ok) throw new Error(`Jupiter answered ${res.status}`)
    const body = await res.json()
    const at = Date.now()
    for (const c of clients) {
      const prices = {}
      for (const m of c.mints) {
        const p = body?.[m]
        if (p && typeof p.usdPrice === 'number') prices[m] = { usd: p.usdPrice, chg: typeof p.priceChange24h === 'number' ? p.priceChange24h : null }
      }
      send(c, { type: 'px', prices, at })
    }
  } catch (err) {
    broadcast({ type: 'status', text: `Live prices paused (${err.message}). Trying again in 2 s.` })
  } finally {
    polling = false
  }
}
setInterval(pollPrices, 2000)

server.listen(PORT, '127.0.0.1', () => console.log(`Agon bots page on http://127.0.0.1:${PORT}/bots.html, live socket at /ws, serving ${ROOT}`))
