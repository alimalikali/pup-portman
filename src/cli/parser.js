/**
 * @typedef {import('../types/domain.js').ParsedArgs} ParsedArgs
 */
import { PortmanError } from '../errors/base.js'
import { EXIT_CODES } from '../constants/exit-codes.js'

/** Verbs the parser knows about. */
const VERBS = new Set([
  'inspect', 'kill', 'list', 'watch', 'save', 'projects', 'forget', 'help', 'version'
])

/** Boolean flags. */
const BOOL_FLAGS = new Set([
  'help', 'version', 'json', 'no-color', 'no-beep', 'yes', 'force'
])
const VALUE_FLAGS = new Set(['interval'])
/** @type {Record<string, Set<string>>} */
const COMMAND_FLAGS = {
  inspect: new Set(['json', 'no-color', 'yes', 'force']),
  kill: new Set(['json', 'no-color', 'yes', 'force']),
  list: new Set(['json', 'no-color']),
  watch: new Set(['json', 'no-color', 'no-beep', 'interval']),
  save: new Set(['json', 'no-color', 'force']),
  projects: new Set(['json', 'no-color']),
  forget: new Set(['json', 'no-color']),
  help: new Set(['no-color', 'help']),
  version: new Set(['version'])
}
/** @type {Record<string, number>} */
const POSITIONAL_COUNTS = {
  inspect: 1, kill: 1, list: 0, watch: 1, save: 2,
  projects: 0, forget: 1, help: 0, version: 0
}

/** Short flag aliases.
 * @type {Record<string, string>}
 */
const SHORT = {
  h: 'help',
  v: 'version',
  y: 'yes',
  f: 'force'
}

/**
 * Hand-rolled argv parser. Single source of truth for verb resolution + flag spec.
 *
 * Verb resolution:
 *   - `--help` / `-h`     => verb 'help'
 *   - `--version` / `-v`  => verb 'version'
 *   - first non-flag positional that matches VERBS => that verb
 *   - first non-flag positional that's all digits   => verb 'inspect' (with the digits as positional)
 *   - empty argv                                    => verb 'help' (with `flags.empty=true`)
 *   - anything else                                 => verb 'help' with `flags.unknownVerb=<value>`
 *
 * @param {string[]} argv
 * @returns {ParsedArgs}
 */
export function parseArgv(argv) {
  if (!Array.isArray(argv)) throw new TypeError('parseArgv: argv must be an array')

  /** @type {string[]} */
  const positionals = []
  /** @type {Record<string, boolean | string>} */
  const flags = Object.create(null)

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]
    if (typeof token !== 'string') continue

    if (token === '--') {
      // Everything after `--` is treated as positional.
      for (let j = i + 1; j < argv.length; j++) positionals.push(argv[j])
      break
    }

    if (token.startsWith('--')) {
      const eq = token.indexOf('=')
      if (eq !== -1) {
        const name = token.slice(2, eq)
        if (!VALUE_FLAGS.has(name)) usageError(`Flag --${name} does not accept a value.`)
        const value = token.slice(eq + 1)
        if (value.length === 0) usageError(`Flag --${name} requires a value.`)
        flags[name] = value
      } else {
        const name = token.slice(2)
        if (BOOL_FLAGS.has(name)) {
          flags[name] = true
        } else if (VALUE_FLAGS.has(name)) {
          const next = argv[i + 1]
          if (next == null || next.startsWith('-')) usageError(`Flag --${name} requires a value.`)
          flags[name] = next
          i++
        } else {
          usageError(`Unknown flag --${name}.`)
        }
      }
      continue
    }

    if (token.startsWith('-') && token.length > 1 && token !== '-') {
      // Short flags can be clustered: -yf  ->  yes + force.
      const cluster = token.slice(1)
      for (const ch of cluster) {
        const long = SHORT[ch]
        if (long) flags[long] = true
        else usageError(`Unknown flag -${ch}.`)
      }
      continue
    }

    positionals.push(token)
  }

  const verb = resolveVerb(positionals, flags)
  const commandPositionals = (flags.help === true || flags.version === true)
    ? []
    : (VERBS.has(positionals[0]) ? positionals.slice(1) : positionals.slice())
  validateCommand(verb, commandPositionals, flags)

  return {
    verb,
    positionals: commandPositionals,
    flags,
    raw: argv.slice()
  }
}

/**
 * @param {string} verb
 * @param {string[]} positionals
 * @param {Record<string, boolean | string>} flags
 */
function validateCommand(verb, positionals, flags) {
  if (flags.unknownVerb) return
  const allowed = COMMAND_FLAGS[verb]
  for (const flag of Object.keys(flags)) {
    if (flag === 'empty') continue
    if (!allowed?.has(flag)) usageError(`Flag --${flag} is not supported by ${verb}.`)
  }
  const expected = POSITIONAL_COUNTS[verb]
  if (expected != null && positionals.length !== expected) {
    usageError(`${verb} expects ${expected} argument${expected === 1 ? '' : 's'}; received ${positionals.length}.`)
  }
  if (verb === 'watch' && typeof flags.interval === 'string' && !/^\d+$/.test(flags.interval)) {
    usageError('--interval must be a positive integer in milliseconds.')
  }
}

/** @param {string} message @returns {never} */
function usageError(message) {
  throw new PortmanError(message, {
    code: 'ERR_INVALID_ARGUMENTS',
    exitCode: EXIT_CODES.USAGE,
    userMessage: `${message} Run "pup-portman --help" for usage.`
  })
}

/**
 * @param {string[]} positionals
 * @param {Record<string, boolean | string>} flags
 * @returns {string}
 */
function resolveVerb(positionals, flags) {
  if (flags.help === true || flags.h === true) return 'help'
  if (flags.version === true) return 'version'
  if (positionals.length === 0) {
    flags.empty = true
    return 'help'
  }
  const first = positionals[0]
  if (VERBS.has(first)) return first
  if (/^[0-9]+$/.test(first)) {
    // Sneak the port back into positionals so commands/inspect.js sees it.
    return 'inspect'
  }
  flags.unknownVerb = first
  return 'help'
}
