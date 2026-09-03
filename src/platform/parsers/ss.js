/**
 * Parse `ss -tlnp` (Linux) output.
 * Pure function — no I/O, no throws.
 *
 * Sample lines:
 *   State  Recv-Q Send-Q Local Address:Port  Peer Address:PortProcess
 *   LISTEN 0      511          0.0.0.0:8080       0.0.0.0:*    users:(("MainThread",pid=4206,fd=26))
 *   LISTEN 0      511                *:3000             *:*    users:(("node",pid=4727,fd=25),("node",pid=4728,fd=27))
 *   LISTEN 0      4096       127.0.0.1:631        0.0.0.0:*
 *
 * Process column may be empty when the user lacks permission to inspect the socket owner.
 *
 * @param {string} stdout
 * @param {{ port?: number }} [opts]
 * @returns {import('../../types/domain.js').ProcessInfo[]}
 */
export function parseSs(stdout, opts = {}) {
  if (typeof stdout !== 'string' || stdout.length === 0) return []
  /** @type {import('../../types/domain.js').ProcessInfo[]} */
  const out = []

  const lines = stdout.split(/\r?\n/)
  for (const raw of lines) {
    const line = raw.trim()
    if (line.length === 0) continue
    if (/^State\s/i.test(line)) continue
    if (!/^LISTEN\b/i.test(line)) continue

    // Columns: State Recv-Q Send-Q Local-Addr:Port Peer-Addr:Port [Process]
    const cols = line.split(/\s+/)
    if (cols.length < 5) continue

    const localAddr = cols[3]
    const port = extractPortFromSsAddress(localAddr)
    if (port == null) continue
    if (opts.port != null && port !== opts.port) continue

    const family = inferFamilyFromAddress(localAddr)
    const procField = cols.slice(5).join(' ')

    const procs = parseProcessField(procField)
    if (procs.length === 0) {
      // No process info available (likely lacking permission). Still surface the port
      // so the user knows it's occupied.
      out.push({
        pid: null,
        command: 'unknown',
        port,
        protocol: 'tcp',
        family
      })
      continue
    }
    for (const { pid, command } of procs) {
      out.push({
        pid,
        command,
        port,
        protocol: 'tcp',
        family
      })
    }
  }
  return mergeFamilies(out)
}

/**
 * @param {string} addr e.g. "0.0.0.0:8080", "*:3000", "[::1]:631", "127.0.0.53%lo:53"
 * @returns {number | null}
 */
function extractPortFromSsAddress(addr) {
  if (!addr) return null
  const idx = addr.lastIndexOf(':')
  if (idx === -1) return null
  const portStr = addr.slice(idx + 1)
  const port = Number.parseInt(portStr, 10)
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : null
}

/**
 * @param {string} addr
 * @returns {'ipv4'|'ipv6'|'both'}
 */
function inferFamilyFromAddress(addr) {
  if (addr.startsWith('[') || /:[0-9a-f]+:/i.test(addr.slice(0, addr.lastIndexOf(':')))) return 'ipv6'
  if (addr.startsWith('*:')) return 'both'
  return 'ipv4'
}

/**
 * Parse `users:(("name",pid=N,fd=N),("name2",pid=M,fd=K))`.
 * @param {string} field
 * @returns {{ pid: number, command: string }[]}
 */
function parseProcessField(field) {
  if (!field) return []
  const result = []
  const re = /\("([^"]+)",pid=(\d+),fd=\d+\)/g
  let m
  while ((m = re.exec(field)) !== null) {
    const command = m[1]
    const pid = Number.parseInt(m[2], 10)
    if (Number.isInteger(pid) && command) {
      result.push({ pid, command })
    }
  }
  return result
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
