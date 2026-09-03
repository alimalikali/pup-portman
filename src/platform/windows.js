import { parseNetstat } from './parsers/netstat.js'
import { parseTasklist } from './parsers/tasklist.js'

/**
 * Build a Windows PlatformAdapter backed by `netstat` + `tasklist`.
 *
 * @param {import('../types/platform.js').ExecFn} exec
 * @returns {import('./contract.js').PlatformAdapter}
 */
export function createWindowsAdapter(exec) {
  return {
    name: 'win',
    async findByPort(port) {
      const { stdout } = await exec('netstat', ['-ano'], { allowFailure: true })
      const rows = parseNetstat(stdout, { port })
      return enrichWithTasklist(exec, rows)
    },
    async listAll() {
      const { stdout } = await exec('netstat', ['-ano'], { allowFailure: true })
      const rows = parseNetstat(stdout)
      return enrichWithTasklist(exec, rows)
    }
  }
}

/**
 * Look up the image name for each unique pid via `tasklist /FI "PID eq <pid>"`.
 * Cached per call to avoid duplicate process lookups.
 *
 * @param {import('../types/platform.js').ExecFn} exec
 * @param {import('../types/domain.js').ProcessInfo[]} rows
 */
async function enrichWithTasklist(exec, rows) {
  /** @type {Map<number, string>} */
  const cache = new Map()
  const uniquePids = [...new Set(rows.map((r) => r.pid).filter((p) => p != null && p > 0))]

  await Promise.all(uniquePids.map(async (pid) => {
    try {
      const { stdout } = await exec('tasklist', ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH'], { allowFailure: true })
      const parsed = parseTasklist(stdout)
      if (parsed) cache.set(pid, parsed.image)
    } catch (_) { /* ignore */ }
  }))

  for (const r of rows) {
    if (r.pid != null && r.command === 'unknown' && cache.has(r.pid)) {
      r.command = /** @type {string} */ (cache.get(r.pid))
    }
  }
  return rows
}
