/**
 * @typedef {import('../types/domain.js').ParsedArgs} ParsedArgs
 */

/** Verbs the parser knows about. */
const VERBS = new Set([
  'inspect', 'kill', 'list', 'watch', 'save', 'projects', 'forget', 'help', 'version'
])

/** Boolean flags. */
const BOOL_FLAGS = new Set([
  'help', 'version', 'json', 'no-color', 'no-beep', 'yes', 'force', 'all'
])

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
        flags[name] = token.slice(eq + 1)
      } else {
        const name = token.slice(2)
        if (BOOL_FLAGS.has(name)) {
          flags[name] = true
        } else {
          // Unknown flag: take the next token as value if it doesn't start with -.
          const next = argv[i + 1]
          if (next != null && !next.startsWith('-')) {
            flags[name] = next
            i++
          } else {
            flags[name] = true
          }
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
        else flags[ch] = true
      }
      continue
    }

    positionals.push(token)
  }

  const verb = resolveVerb(positionals, flags)

  return {
    verb,
    positionals: positionals.filter((p) => p !== verb),
    flags,
    raw: argv.slice()
  }
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
