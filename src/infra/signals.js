import { SIGNALS_TO_HANDLE } from '../constants/signals.js'

/**
 * Install once-only handlers for SIGINT/SIGTERM/SIGHUP. Returns an
 * unregister function. Handler runs at most once even if multiple signals fire.
 * @param {() => void | Promise<void>} handler
 * @returns {() => void}
 */
export function registerShutdown(handler) {
  let fired = false
  const wrapped = async () => {
    if (fired) return
    fired = true
    try { await handler() } catch (_) { /* ignore */ }
  }
  for (const sig of SIGNALS_TO_HANDLE) {
    process.on(sig, wrapped)
  }
  return () => {
    for (const sig of SIGNALS_TO_HANDLE) {
      process.off(sig, wrapped)
    }
  }
}
