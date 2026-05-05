import { sleep } from '../utils/promise.js'
import { WATCH_INTERVAL_MS } from '../constants/defaults.js'

/**
 * Async generator that polls a port at `intervalMs` and yields a status per tick.
 * Stops cleanly on AbortSignal.
 *
 * @param {number} port
 * @param {object} opts
 * @param {import('./../platform/contract.js').PlatformAdapter} opts.adapter
 * @param {AbortSignal} opts.signal
 * @param {number} [opts.intervalMs]
 * @returns {AsyncGenerator<import('../types/domain.js').PortStatus>}
 */
export async function* watchPort(port, opts) {
  const intervalMs = opts.intervalMs ?? WATCH_INTERVAL_MS
  if (!opts.adapter) throw new TypeError('watchPort: adapter is required')
  if (!opts.signal) throw new TypeError('watchPort: signal is required')

  while (!opts.signal.aborted) {
    const processes = await opts.adapter.findByPort(port)
    yield {
      port,
      occupied: processes.length > 0,
      processes
    }
    if (opts.signal.aborted) return
    try {
      await sleep(intervalMs, { signal: opts.signal })
    } catch (err) {
      if (/** @type {Error} */ (err).name === 'AbortError') return
      throw err
    }
  }
}
