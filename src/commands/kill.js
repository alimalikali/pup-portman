import { EXIT_CODES } from '../constants/exit-codes.js'
import { print, printJson } from '../ui/output.js'
import { createColor, shouldUseColor } from '../ui/color.js'
import { parsePort } from '../core/port.js'
import { killProcess } from '../core/process-killer.js'
import { waitForPortRelease } from '../core/port-release.js'
import { PortNotFoundError, InvalidPortError } from '../errors/port-errors.js'
import { PermissionDeniedError } from '../errors/permission-errors.js'
import { PortmanError } from '../errors/base.js'

/**
 * `pup-portman kill <port>` — kill all processes on a port without prompting.
 *
 * @param {import('../types/domain.js').ParsedArgs} parsed
 * @param {import('../cli/router.js').CliContext} ctx
 * @returns {Promise<number>}
 */
export async function kill(parsed, ctx) {
  const portStr = parsed.positionals[0]
  if (portStr == null) throw new InvalidPortError(undefined, 'no port given')
  const port = parsePort(portStr)

  const json = parsed.flags.json === true
  const noColor = parsed.flags['no-color'] === true
  const force = parsed.flags.force === true || parsed.flags.f === true

  const processes = await ctx.adapter.findByPort(port)
  if (processes.length === 0) {
    if (json) {
      printJson(ctx, { port, killed: [], notFound: true })
      return EXIT_CODES.OK
    }
    throw new PortNotFoundError(port)
  }

  const actionable = processes.filter((p) => p.pid != null && p.pid > 0)
  if (actionable.length === 0) {
    if (json) {
      printJson(ctx, {
        port, killed: [], free: false, remaining: processes,
        error: { code: 'ERR_PERMISSION_DENIED', message: `Unable to identify the process listening on port ${port}.` }
      })
      return EXIT_CODES.PERMISSION
    }
    throw new PermissionDeniedError(`identify the process listening on port ${port}`, { port })
  }

  /** @type {import('../types/platform.js').KillResult[]} */
  const results = []
  const uniqueProcesses = [...new Map(actionable.map((p) => [p.pid, p])).values()]
  for (const p of uniqueProcesses) {
    if (p.pid == null) continue
    const result = await killProcess(p.pid, { platform: ctx.platform, exec: ctx.exec, force })
    results.push(result)
  }

  const finalState = await waitForPortRelease(port, { adapter: ctx.adapter })

  if (json) {
    printJson(ctx, { port, killed: results, free: finalState.free, remaining: finalState.processes })
    return finalState.free ? EXIT_CODES.OK : EXIT_CODES.GENERAL
  }

  const color = createColor(shouldUseColor({ env: ctx.env, stream: ctx.stdout, disabled: noColor }))
  for (const r of results) {
    const tag = r.escalated ? color.yellow(' (escalated to SIGKILL)') : ''
    print(ctx, color.green(`  ✓ killed pid ${r.pid}${tag}`))
  }
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
