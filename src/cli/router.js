import * as commands from '../commands/index.js'
import { printHelp } from './help.js'
import { printVersion } from './version.js'
import { EXIT_CODES } from '../constants/exit-codes.js'
import { createColor, shouldUseColor } from '../ui/color.js'

/**
 * @typedef {object} CliContext
 * @property {NodeJS.WriteStream} stdout
 * @property {NodeJS.WriteStream} stderr
 * @property {NodeJS.ReadStream} stdin
 * @property {NodeJS.ProcessEnv} env
 * @property {string} cwd
 * @property {import('../types/platform.js').ExecFn} exec
 * @property {import('../platform/contract.js').PlatformAdapter} adapter
 * @property {import('../infra/store.js').ProjectStore} store
 * @property {(message: string, opts?: any) => Promise<boolean>} prompt
 * @property {import('../types/domain.js').PlatformTag} platform
 */

const REGISTRY = new Map([
  ['inspect', commands.inspect],
  ['kill', commands.kill],
  ['list', commands.list],
  ['watch', commands.watch],
  ['save', commands.save],
  ['projects', commands.projects],
  ['forget', commands.forget]
])

/**
 * Dispatch to the right command handler.
 * @param {import('../types/domain.js').ParsedArgs} parsed
 * @param {CliContext} ctx
 * @returns {Promise<number>}
 */
export async function route(parsed, ctx) {
  if (parsed.verb === 'version') {
    await printVersion(ctx)
    return EXIT_CODES.OK
  }
  if (parsed.verb === 'help') {
    const color = createColor(shouldUseColor({
      env: ctx.env,
      stream: ctx.stdout,
      disabled: parsed.flags['no-color'] === true
    }))
    printHelp(ctx, {
      unknownVerb: typeof parsed.flags.unknownVerb === 'string' ? parsed.flags.unknownVerb : undefined,
      color
    })
    if (parsed.flags.unknownVerb || parsed.flags.empty) return EXIT_CODES.USAGE
    return EXIT_CODES.OK
  }
  const handler = REGISTRY.get(parsed.verb)
  if (!handler) {
    printHelp(ctx, { unknownVerb: parsed.verb })
    return EXIT_CODES.USAGE
  }
  return handler(parsed, ctx)
}
