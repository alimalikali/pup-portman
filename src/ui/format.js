import { color as defaultColor } from './color.js'
import { renderTable } from './table.js'

/**
 * @typedef {import('../types/domain.js').ProcessInfo} ProcessInfo
 * @typedef {import('../types/domain.js').ProjectEntry} ProjectEntry
 */

/**
 * Render a single process detail block (used by the inspect command).
 * @param {ProcessInfo} p
 * @param {{ color?: typeof defaultColor }} [opts]
 */
export function formatProcessBlock(p, opts = {}) {
  const c = opts.color ?? defaultColor
  const lines = [
    `  ${c.yellow('●')} port ${c.bold(String(p.port))}`,
    `    process   ${p.command}`,
    `    pid       ${p.pid ?? c.yellow('unavailable (try elevated privileges)')}`,
    `    protocol  ${p.protocol}/${p.family}`
  ]
  if (p.user) lines.push(`    user      ${p.user}`)
  return lines.join('\n')
}

/**
 * Render the `list` table.
 * @param {ProcessInfo[]} occupied
 * @param {ProjectEntry[]} saved
 * @param {{ color?: typeof defaultColor }} [opts]
 * @returns {string}
 */
export function formatList(occupied, saved, opts = {}) {
  const c = opts.color ?? defaultColor
  const occupiedPorts = new Set(occupied.map((p) => p.port))

  const rows = []
  for (const p of occupied) {
    const savedEntry = saved.find((e) => e.port === p.port)
    const label = savedEntry ? c.cyan(savedEntry.name) : c.dim('—')
    rows.push([
      c.yellow('●'),
      String(p.port),
      p.command,
      p.pid == null ? c.yellow('unknown') : String(p.pid),
      label
    ])
  }
  for (const e of saved) {
    if (occupiedPorts.has(e.port)) continue
    rows.push([
      c.green('○'),
      String(e.port),
      c.dim('— free —'),
      '',
      c.cyan(e.name)
    ])
  }

  if (rows.length === 0) {
    return c.dim('  no listening ports detected')
  }

  const table = renderTable(
    ['', 'PORT', 'PROCESS', 'PID', 'NAME'],
    rows,
    { headerTransform: (h) => c.dim(h) }
  )
  return table
    .split('\n')
    .map((l) => '  ' + l)
    .join('\n')
}

/**
 * Render the `projects` table.
 * @param {ProjectEntry[]} entries
 * @param {{ color?: typeof defaultColor }} [opts]
 */
export function formatProjects(entries, opts = {}) {
  const c = opts.color ?? defaultColor
  if (entries.length === 0) {
    return c.dim('  no saved projects yet — use `pup-portman save <port> <name>` to add one')
  }
  const rows = entries.map((e) => [String(e.port), c.cyan(e.name), c.dim(formatRelativeTime(e.savedAt))])
  return renderTable(['PORT', 'NAME', 'SAVED'], rows, { headerTransform: (h) => c.dim(h) })
    .split('\n')
    .map((l) => '  ' + l)
    .join('\n')
}

/**
 * @param {string} iso
 * @returns {string}
 */
export function formatRelativeTime(iso) {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return iso
  const ms = Date.now() - t
  if (ms < 0) return 'just now'
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}
