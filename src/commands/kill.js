import { EXIT_CODES } from '../constants/exit-codes.js'
import { print, printJson } from '../ui/output.js'
import { createColor, shouldUseColor } from '../ui/color.js'
import { parsePort } from '../core/port.js'
import { killProcess } from '../core/process-killer.js'
import { PortNotFoundError, InvalidPortError } from '../errors/port-errors.js'

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

  /** @type {import('../types/platform.js').KillResult[]} */
  const results = []
  for (const p of processes) {
    const result = await killProcess(p.pid, { platform: ctx.platform, exec: ctx.exec, force })
    results.push(result)
  }

  if (json) {
    printJson(ctx, { port, killed: results })
    return EXIT_CODES.OK
  }

  const color = createColor(shouldUseColor({ env: ctx.env, stream: ctx.stdout, disabled: noColor }))
  for (const r of results) {
    const tag = r.escalated ? color.yellow(' (escalated to SIGKILL)') : ''
    print(ctx, color.green(`  ✓ killed pid ${r.pid}${tag}`))
  }
  print(ctx, color.green(`  port ${port} is free.`))
  return EXIT_CODES.OK
}
