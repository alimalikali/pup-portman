import { readFile } from 'node:fs/promises'
import { parseSs } from './parsers/ss.js'

/**
 * Build a Linux PlatformAdapter backed by `ss` (iproute2). When ss reports an
 * empty Process column (lack of permission), best-effort fills the command name
 * by reading /proc/<pid>/comm — which works for our own processes.
 *
 * @param {import('../types/platform.js').ExecFn} exec
 * @returns {import('./contract.js').PlatformAdapter}
 */
export function createLinuxAdapter(exec) {
  return {
    name: 'linux',
    async findByPort(port) {
      const { stdout } = await exec('ss', ['-tlnpH', `sport = :${port}`], { allowFailure: true })
      const parsed = parseSs(stdout, { port })
      return enrichFromProc(parsed)
    },
    async listAll() {
      const { stdout } = await exec('ss', ['-tlnp'], { allowFailure: true })
      const parsed = parseSs(stdout)
      return enrichFromProc(parsed)
    }
  }
}

/**
 * If a row has pid > 0 but no command (or 'unknown'), try /proc/<pid>/comm.
 * @param {import('../types/domain.js').ProcessInfo[]} entries
 */
async function enrichFromProc(entries) {
  await Promise.all(entries.map(async (e) => {
    if (e.pid != null && e.pid > 0 && (!e.command || e.command === 'unknown')) {
      try {
        const comm = (await readFile(`/proc/${e.pid}/comm`, 'utf8')).trim()
        if (comm.length > 0) e.command = comm
      } catch (_) { /* ignore — process may have exited */ }
    }
  }))
  return entries
}
