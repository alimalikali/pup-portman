/**
 * Parse `netstat -ano` (Windows) output.
 * Pure function — no I/O, no throws.
 *
 * Sample lines:
 *     Proto  Local Address          Foreign Address        State           PID
 *     TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       48291
 *     TCP    [::]:3000              [::]:0                 LISTENING       48291
 *     UDP    0.0.0.0:5353           *:*                                    1234
 *
 * @param {string} stdout
 * @param {{ port?: number, listeningOnly?: boolean }} [opts]
 * @returns {import('../../types/domain.js').ProcessInfo[]}
 */
export function parseNetstat(stdout, opts = {}) {
  if (typeof stdout !== 'string' || stdout.length === 0) return []
  const listeningOnly = opts.listeningOnly !== false

  /** @type {import('../../types/domain.js').ProcessInfo[]} */
  const out = []
  const lines = stdout.split(/\r?\n/)

  for (const raw of lines) {
    const line = raw.trim()
    if (line.length === 0) continue
    if (/^Proto\b/i.test(line)) continue
    if (/^Active Connections/i.test(line)) continue

    const cols = line.split(/\s+/)
    if (cols.length < 4) continue

    const proto = cols[0].toUpperCase()
    if (proto !== 'TCP' && proto !== 'UDP') continue

    const localAddr = cols[1]
    const port = extractPortFromAddress(localAddr)
    if (port == null) continue
    if (opts.port != null && port !== opts.port) continue

    let state = ''
    let pidStr = ''
    if (proto === 'TCP') {
      // TCP: Proto, Local, Foreign, State, PID
      if (cols.length < 5) continue
      state = cols[3]
      pidStr = cols[4]
      if (listeningOnly && state.toUpperCase() !== 'LISTENING') continue
    } else {
      // UDP: Proto, Local, Foreign, PID  (no state column)
      pidStr = cols[3]
    }

    const pid = Number.parseInt(pidStr, 10)
    if (!Number.isInteger(pid)) continue

    out.push({
      pid,
      command: 'unknown',
      port,
      protocol: /** @type {'tcp'|'udp'} */ (proto.toLowerCase()),
      family: localAddr.startsWith('[') ? 'ipv6' : 'ipv4'
    })
  }
  return mergeFamilies(out)
}

/**
 * @param {string} addr e.g. "0.0.0.0:3000", "[::]:3000", "127.0.0.1:5939"
 * @returns {number | null}
 */
function extractPortFromAddress(addr) {
  if (!addr) return null
  const idx = addr.lastIndexOf(':')
  if (idx === -1) return null
  const portStr = addr.slice(idx + 1)
  const port = Number.parseInt(portStr, 10)
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : null
}

/**
 * @param {import('../../types/domain.js').ProcessInfo[]} entries
 */
function mergeFamilies(entries) {
  const map = new Map()
  for (const e of entries) {
    const key = `${e.pid}|${e.port}|${e.protocol}`
    const existing = map.get(key)
    if (!existing) {
      map.set(key, { ...e })
      continue
    }
    if (existing.family !== e.family) existing.family = 'both'
  }
  return Array.from(map.values())
}
