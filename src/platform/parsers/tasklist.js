/**
 * Parse `tasklist /FI "PID eq <pid>" /FO CSV /NH` (Windows) output.
 * Pure function — no I/O, no throws.
 *
 * Sample output (single line, no header due to /NH):
 *   "node.exe","48291","Console","1","45,672 K"
 *
 * @param {string} stdout
 * @returns {{ pid: number, image: string } | null}
 */
export function parseTasklist(stdout) {
  if (typeof stdout !== 'string' || stdout.length === 0) return null
  const line = stdout.split(/\r?\n/).find((l) => l.trim().length > 0)
  if (!line) return null

  const fields = parseCsvLine(line)
  if (fields.length < 2) return null

  const image = fields[0]
  const pid = Number.parseInt(fields[1], 10)
  if (!Number.isInteger(pid)) return null

  return {
    pid,
    image: stripExeSuffix(image)
  }
}

/**
 * @param {string} line
 * @returns {string[]}
 */
function parseCsvLine(line) {
  /** @type {string[]} */
  const out = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out
}

/**
 * @param {string} name
 */
function stripExeSuffix(name) {
  return name.replace(/\.exe$/i, '')
}
