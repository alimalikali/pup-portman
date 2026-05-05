import { EXIT_CODES } from '../constants/exit-codes.js'
import { print, printJson } from '../ui/output.js'
import { formatProjects } from '../ui/format.js'
import { createColor, shouldUseColor } from '../ui/color.js'

/**
 * `pup-portman projects` — show saved port-to-name map.
 *
 * @param {import('../types/domain.js').ParsedArgs} parsed
 * @param {import('../cli/router.js').CliContext} ctx
 * @returns {Promise<number>}
 */
export async function projects(parsed, ctx) {
  const json = parsed.flags.json === true
  const noColor = parsed.flags['no-color'] === true

  const entries = await ctx.store.list()

  if (json) {
    printJson(ctx, entries)
    return EXIT_CODES.OK
  }
  const color = createColor(shouldUseColor({ env: ctx.env, stream: ctx.stdout, disabled: noColor }))
  print(ctx, formatProjects(entries, { color }))
  return EXIT_CODES.OK
}
