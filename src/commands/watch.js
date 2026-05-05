import { EXIT_CODES } from '../constants/exit-codes.js'
import { print, printJson } from '../ui/output.js'
import { createColor, shouldUseColor } from '../ui/color.js'
import { parsePort } from '../core/port.js'
import { watchPort } from '../core/port-watcher.js'
import { registerShutdown } from '../infra/signals.js'
import { beep } from '../ui/beep.js'
import { WATCH_INTERVAL_MS } from '../constants/defaults.js'
import { InvalidPortError } from '../errors/port-errors.js'

/**
 * `pup-portman watch <port>` — poll until the port is free, then beep.
 *
 * @param {import('../types/domain.js').ParsedArgs} parsed
 * @param {import('../cli/router.js').CliContext} ctx
 * @returns {Promise<number>}
 */
export async function watch(parsed, ctx) {
  const portStr = parsed.positionals[0]
  if (portStr == null) throw new InvalidPortError(undefined, 'no port given')
  const port = parsePort(portStr)

  const json = parsed.flags.json === true
  const noColor = parsed.flags['no-color'] === true
  const noBeep = parsed.flags['no-beep'] === true
  const intervalRaw = parsed.flags.interval
  const intervalMs = typeof intervalRaw === 'string'
    ? Math.max(50, Number.parseInt(intervalRaw, 10) || WATCH_INTERVAL_MS)
    : WATCH_INTERVAL_MS

  const ac = new AbortController()
  const unregister = registerShutdown(() => ac.abort())

  const color = createColor(shouldUseColor({ env: ctx.env, stream: ctx.stdout, disabled: noColor }))
  if (!json) {
    print(ctx, color.dim(`  watching port ${port} — press Ctrl+C to stop`))
  }

  const startedAt = Date.now()
  /** @type {boolean | null} */
  let lastOccupied = null
  /** @type {number} */
  let exitCode = EXIT_CODES.OK

  try {
    for await (const status of watchPort(port, { adapter: ctx.adapter, signal: ac.signal, intervalMs })) {
      if (status.occupied !== lastOccupied) {
        if (json) {
          printJson(ctx, { ...status, elapsedMs: Date.now() - startedAt })
        } else if (lastOccupied === null && status.occupied) {
          // First tick: confirm we're watching an occupied port.
        }
        lastOccupied = status.occupied
      }
      if (!status.occupied && lastOccupied === false) {
        const elapsedSec = Math.round((Date.now() - startedAt) / 1000)
        if (!json) {
          print(ctx, color.green(`  ✓ port ${port} is now free  (${elapsedSec}s)`))
        }
        beep(ctx.stdout, { disabled: noBeep })
        break
      }
    }
  } finally {
    unregister()
  }

  if (ac.signal.aborted) {
    exitCode = EXIT_CODES.ABORTED
    if (!json) print(ctx, color.dim('  watch stopped.'))
  }
  return exitCode
}
