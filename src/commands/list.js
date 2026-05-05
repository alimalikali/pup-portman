import { EXIT_CODES } from '../constants/exit-codes.js'
import { print, printJson } from '../ui/output.js'
import { formatList } from '../ui/format.js'
import { createColor, shouldUseColor } from '../ui/color.js'

/**
 * `pup-portman list`
 *
 * @param {import('../types/domain.js').ParsedArgs} parsed
 * @param {import('../cli/router.js').CliContext} ctx
 * @returns {Promise<number>}
 */
export async function list(parsed, ctx) {
  const json = parsed.flags.json === true
  const noColor = parsed.flags['no-color'] === true

  const [occupied, saved] = await Promise.all([
    ctx.adapter.listAll(),
    ctx.store.list().catch(() => [])
  ])

  if (json) {
    printJson(ctx, { occupied, saved })
    return EXIT_CODES.OK
  }

  const color = createColor(shouldUseColor({ env: ctx.env, stream: ctx.stdout, disabled: noColor }))
  print(ctx, formatList(occupied, saved, { color }))
  return EXIT_CODES.OK
}
