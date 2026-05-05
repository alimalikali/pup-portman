import { isCI, isTTY, envBool } from '../utils/env.js'

const CODES = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
}

/**
 * Decide whether color should be enabled given environment + flags.
 * Order: explicit disable > NO_COLOR > FORCE_COLOR > CI > TTY.
 * @param {object} [opts]
 * @param {NodeJS.ProcessEnv} [opts.env]
 * @param {NodeJS.WriteStream | { isTTY?: boolean }} [opts.stream]
 * @param {boolean} [opts.disabled]   // explicit --no-color
 * @returns {boolean}
 */
export function shouldUseColor({ env = process.env, stream = process.stdout, disabled = false } = {}) {
  if (disabled) return false
  if (env.NO_COLOR != null && env.NO_COLOR !== '') return false
  if (envBool(env.FORCE_COLOR)) return true
  if (isCI(env)) return false
  return isTTY(stream)
}

/**
 * Build a Color helper bound to the resolved enabled flag.
 * @param {boolean} enabled
 */
export function createColor(enabled) {
  /** @param {string} c @returns {(s: string) => string} */
  const wrap = (c) => enabled ? (s) => `${c}${s}${CODES.reset}` : (s) => s
  return {
    enabled,
    bold: wrap(CODES.bold),
    dim: wrap(CODES.dim),
    red: wrap(CODES.red),
    green: wrap(CODES.green),
    yellow: wrap(CODES.yellow),
    blue: wrap(CODES.blue),
    magenta: wrap(CODES.magenta),
    cyan: wrap(CODES.cyan),
    gray: wrap(CODES.gray)
  }
}

/** Default color helper, auto-detected at module load. */
export const color = createColor(shouldUseColor())
