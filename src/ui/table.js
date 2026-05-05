import { padRight, visibleWidth } from '../utils/string.js'

/**
 * Render a simple text table. ANSI-aware width.
 * @param {string[]} headers
 * @param {string[][]} rows
 * @param {{ gap?: number, headerTransform?: (s: string) => string }} [opts]
 * @returns {string}
 */
export function renderTable(headers, rows, opts = {}) {
  const gap = opts.gap ?? 2
  const cols = headers.length
  const widths = new Array(cols).fill(0)

  for (let c = 0; c < cols; c++) {
    widths[c] = visibleWidth(headers[c])
  }
  for (const row of rows) {
    for (let c = 0; c < cols; c++) {
      const cell = row[c] ?? ''
      const w = visibleWidth(String(cell))
      if (w > widths[c]) widths[c] = w
    }
  }

  const sep = ' '.repeat(gap)
  const transformHeader = opts.headerTransform ?? ((s) => s)

  const lines = []
  lines.push(headers.map((h, c) => padRight(transformHeader(h), widths[c])).join(sep).trimEnd())
  for (const row of rows) {
    lines.push(row.map((cell, c) => padRight(String(cell ?? ''), widths[c])).join(sep).trimEnd())
  }
  return lines.join('\n')
}
