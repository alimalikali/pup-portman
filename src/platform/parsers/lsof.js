/**
 * Parse `lsof -i -P -n` (or `lsof -i :<port> -P -n`) output.
 * Pure function — no I/O, no throws.
 *
 * Sample line:
 *   node    48291  ali   23u  IPv6 0x12345abcd      0t0  TCP *:3000 (LISTEN)
 *
 * @param {string} stdout
 * @param {{ port?: number }} [opts]
 * @returns {import('../../types/domain.js').ProcessInfo[]}
 */
export function parseLsof(stdout, opts = {}) {
  if (typeof stdout !== 'string' || stdout.length === 0) return []
  /** @type {import('../../types/domain.js').ProcessInfo[]} */
  const out = []
  const lines = stdout.split(/\r?\n/)
  for (const raw of lines) {
    const line = raw.trim()
    if (line.length === 0) continue
    if (line.startsWith('COMMAND')) continue

    const cols = line.split(/\s+/)
    if (cols.length < 9) continue

    const command = cols[0]
    const pid = Number.parseInt(cols[1], 10)
    const user = cols[2]
    const type = cols[4] // IPv4 / IPv6
    const proto = cols[7] // TCP / UDP
    const nameField = cols.slice(8).join(' ') // e.g. "*:3000 (LISTEN)" or "127.0.0.1:5432->1.2.3.4:9999 (ESTABLISHED)"

    if (!Number.isInteger(pid)) continue
    if (proto !== 'TCP' && proto !== 'UDP') continue

    // Only care about LISTEN sockets — these are what bind a port.
    if (proto === 'TCP' && !/\(LISTEN\)/i.test(nameField)) continue

    const port = extractPortFromLsofName(nameField)
    if (port == null) continue
    if (opts.port != null && port !== opts.port) continue

    /** @type {'ipv4' | 'ipv6' | 'both'} */
    let family = 'ipv4'
    if (type === 'IPv6') family = 'ipv6'

    out.push({
      pid,
      command,
      port,
      protocol: /** @type {'tcp'|'udp'} */ (proto.toLowerCase() === 'udp' ? 'udp' : 'tcp'),
      family,
      user
    })
  }
  return mergeFamilies(out)
}

/**
 * Extract the local port from an lsof NAME column entry.
 * Examples:
 *   "*:3000 (LISTEN)"             -> 3000
 *   "127.0.0.1:5432 (LISTEN)"     -> 5432
 *   "[::1]:8080 (LISTEN)"         -> 8080
 *   "10.0.0.1:80->1.2.3.4:9999"   -> 80
 * @param {string} name
 * @returns {number | null}
 */
function extractPortFromLsofName(name) {
  // The local part is before "->" if present.
  const local = name.split('->')[0]
  // Take what's before " (..." annotation.
  const justAddr = local.replace(/\s+\(.*$/, '')
  // Port is after the last ":".
  const idx = justAddr.lastIndexOf(':')
  if (idx === -1) return null
  const portStr = justAddr.slice(idx + 1).trim()
  const port = Number.parseInt(portStr, 10)
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : null
}

/**
 * Collapse duplicate (pid, port, protocol) entries that differ only by family
 * into a single entry with family=both.
 * @param {import('../../types/domain.js').ProcessInfo[]} entries
 * @returns {import('../../types/domain.js').ProcessInfo[]}
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
