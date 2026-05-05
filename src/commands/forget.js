import { EXIT_CODES } from '../constants/exit-codes.js'
import { print, printJson } from '../ui/output.js'
import { createColor, shouldUseColor } from '../ui/color.js'
import { PortmanError } from '../errors/base.js'

/**
 * `pup-portman forget <name>` — remove a saved project entry by name.
 *
 * @param {import('../types/domain.js').ParsedArgs} parsed
 * @param {import('../cli/router.js').CliContext} ctx
 * @returns {Promise<number>}
 */
export async function forget(parsed, ctx) {
  const name = parsed.positionals[0]
  if (name == null || name.trim().length === 0) {
    throw new PortmanError('forget: missing <name>', {
      code: 'ERR_MISSING_NAME',
      exitCode: EXIT_CODES.USAGE,
      userMessage: 'Usage: pup-portman forget <name>'
    })
  }

  const json = parsed.flags.json === true
  const noColor = parsed.flags['no-color'] === true

  const removed = await ctx.store.remove(name.trim())

  if (json) {
    printJson(ctx, { name: name.trim(), removed })
    return removed ? EXIT_CODES.OK : EXIT_CODES.NOT_FOUND
  }

  const color = createColor(shouldUseColor({ env: ctx.env, stream: ctx.stdout, disabled: noColor }))
  if (removed) {
    print(ctx, color.green(`  ✓ forgot "${name}"`))
    return EXIT_CODES.OK
  }
  print(ctx, color.dim(`  no saved project named "${name}"`))
  return EXIT_CODES.NOT_FOUND
}
