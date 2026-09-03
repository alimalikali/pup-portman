import { PORT_RELEASE_INTERVAL_MS, PORT_RELEASE_TIMEOUT_MS } from '../constants/defaults.js'
import { sleep } from '../utils/promise.js'

/**
 * Wait until a port has no listeners, returning the final observable state.
 * @param {number} port
 * @param {{ adapter: import('../platform/contract.js').PlatformAdapter, timeoutMs?: number, intervalMs?: number }} opts
 */
export async function waitForPortRelease(port, opts) {
  const timeoutMs = opts.timeoutMs ?? PORT_RELEASE_TIMEOUT_MS
  const intervalMs = opts.intervalMs ?? PORT_RELEASE_INTERVAL_MS
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const processes = await opts.adapter.findByPort(port)
    if (processes.length === 0) return { free: true, processes }
    if (Date.now() >= deadline) return { free: false, processes }
    await sleep(Math.min(intervalMs, Math.max(1, deadline - Date.now())))
  }
}
