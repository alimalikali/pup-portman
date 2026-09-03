import { EXIT_CODES } from '../constants/exit-codes.js'
import { print, printJson } from '../ui/output.js'
import { formatProcessBlock } from '../ui/format.js'
import { createColor, shouldUseColor } from '../ui/color.js'
import { parsePort } from '../core/port.js'
import { killProcess } from '../core/process-killer.js'
import { waitForPortRelease } from '../core/port-release.js'
import { PortNotFoundError, InvalidPortError } from '../errors/port-errors.js'
import { PermissionDeniedError } from '../errors/permission-errors.js'
import { PortmanError } from '../errors/base.js'

/**
 * `pup-portman <port>` — show what's on a port and prompt to kill.
 *
 * @param {import('../types/domain.js').ParsedArgs} parsed
 * @param {import('../cli/router.js').CliContext} ctx
 * @returns {Promise<number>}
 */
export async function inspect(parsed, ctx) {
  const portStr = parsed.positionals[0]
  if (portStr == null) throw new InvalidPortError(undefined, 'no port given')
  const port = parsePort(portStr)

  const json = parsed.flags.json === true
  const noColor = parsed.flags['no-color'] === true
  const assumeYes = parsed.flags.yes === true || parsed.flags.y === true
  const force = parsed.flags.force === true || parsed.flags.f === true

  const processes = await ctx.adapter.findByPort(port)
  if (processes.length === 0) {
    if (json) {
      printJson(ctx, { port, occupied: false, processes: [] })
      return EXIT_CODES.OK
    }
    throw new PortNotFoundError(port)
  }

  if (json) {
    // JSON mode: do not prompt. Killing requires explicit `kill` verb.
    printJson(ctx, { port, occupied: true, processes })
    return EXIT_CODES.OK
  }

  const color = createColor(shouldUseColor({ env: ctx.env, stream: ctx.stdout, disabled: noColor }))
  for (const p of processes) {
    print(ctx, formatProcessBlock(p, { color }))
  }
  print(ctx, '')

  const actionable = processes.filter((p) => p.pid != null && p.pid > 0)
  if (actionable.length === 0) {
    throw new PermissionDeniedError(`identify the process listening on port ${port}`, { port })
  }

  const proceed = await ctx.prompt(`kill ${actionable.length === 1 ? `pid ${actionable[0].pid}` : `${actionable.length} processes`} on port ${port}?`, {
    default: false,
    assumeYes,
    input: ctx.stdin,
    output: ctx.stdout
  })

  if (!proceed) {
    print(ctx, color.dim('  aborted — nothing killed.'))
    return EXIT_CODES.OK
  }

  for (const p of actionable) {
    if (p.pid == null) continue
    const result = await killProcess(p.pid, { platform: ctx.platform, exec: ctx.exec, force })
    const tag = result.escalated ? color.yellow(' (escalated to SIGKILL)') : ''
    print(ctx, color.green(`  ✓ killed pid ${result.pid}${tag}`))
  }
  const finalState = await waitForPortRelease(port, { adapter: ctx.adapter })
  if (!finalState.free) {
    throw new PortmanError(`Port ${port} is still occupied after termination`, {
      code: 'ERR_PORT_STILL_IN_USE', exitCode: EXIT_CODES.GENERAL,
      userMessage: `Signals were sent, but port ${port} is still occupied.`,
      details: { port, remaining: finalState.processes }
    })
  }
  print(ctx, color.green(`  port ${port} is free.`))
  return EXIT_CODES.OK
}
