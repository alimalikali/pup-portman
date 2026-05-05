// eslint-disable-next-line no-control-regex
const ANSI_REGEX = /\x1b\[[0-9;]*m/g

/**
 * Strip ANSI escape sequences from a string.
 * @param {string} s
 * @returns {string}
 */
export function stripAnsi(s) {
  return s.replace(ANSI_REGEX, '')
}

/**
 * Visible width of a string (ANSI-aware). Does not handle CJK width.
 * @param {string} s
 * @returns {number}
 */
export function visibleWidth(s) {
  return stripAnsi(s).length
}

/**
 * Pad a string to width on the right (ANSI-aware).
 * @param {string} s
 * @param {number} width
 * @param {string} [fill]
 * @returns {string}
 */
export function padRight(s, width, fill = ' ') {
  const w = visibleWidth(s)
  if (w >= width) return s
  return s + fill.repeat(width - w)
}

/**
 * Pad a string to width on the left (ANSI-aware).
 * @param {string} s
 * @param {number} width
 * @param {string} [fill]
 * @returns {string}
 */
export function padLeft(s, width, fill = ' ') {
  const w = visibleWidth(s)
  if (w >= width) return s
  return fill.repeat(width - w) + s
}

/**
 * Truncate a string to max visible width, appending ellipsis when truncated.
 * Strips ANSI before measuring; the returned string contains no ANSI.
 * @param {string} s
 * @param {number} max
 * @returns {string}
 */
export function truncate(s, max) {
  const plain = stripAnsi(s)
  if (plain.length <= max) return plain
  if (max <= 1) return plain.slice(0, max)
  return plain.slice(0, max - 1) + '…'
}
