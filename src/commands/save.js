import { EXIT_CODES } from '../constants/exit-codes.js'
import { print, printJson } from '../ui/output.js'
import { createColor, shouldUseColor } from '../ui/color.js'
import { parsePort } from '../core/port.js'
import { InvalidPortError } from '../errors/port-errors.js'
import { PortmanError } from '../errors/base.js'

/**
 * `pup-portman save <port> <name>` — store a friendly name for a port.
 *
 * @param {import('../types/domain.js').ParsedArgs} parsed
 * @param {import('../cli/router.js').CliContext} ctx
 * @returns {Promise<number>}
 */
export async function save(parsed, ctx) {
  const [portStr, name] = parsed.positionals
  if (portStr == null) throw new InvalidPortError(undefined, 'no port given')
  if (name == null || name.trim().length === 0) {
    throw new PortmanError('save: missing <name>', {
      code: 'ERR_MISSING_NAME',
      exitCode: EXIT_CODES.USAGE,
      userMessage: 'Usage: pup-portman save <port> <name>'
    })
  }

  const port = parsePort(portStr)
  const force = parsed.flags.force === true || parsed.flags.f === true
  const json = parsed.flags.json === true
  const noColor = parsed.flags['no-color'] === true

  const entry = await ctx.store.save(port, name, { force })

  if (json) {
    printJson(ctx, entry)
    return EXIT_CODES.OK
  }
  const color = createColor(shouldUseColor({ env: ctx.env, stream: ctx.stdout, disabled: noColor }))
  print(ctx, color.green(`  ✓ saved port ${entry.port} as "${entry.name}"`))
  return EXIT_CODES.OK
}
