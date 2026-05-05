import { createInterface } from 'node:readline'
import { isTTY } from '../utils/env.js'

/**
 * @param {string} message
 * @param {object} [opts]
 * @param {boolean} [opts.default=false]
 * @param {boolean} [opts.assumeYes=false]
 * @param {NodeJS.ReadStream} [opts.input]
 * @param {NodeJS.WriteStream} [opts.output]
 * @param {AbortSignal} [opts.signal]
 * @returns {Promise<boolean>}
 */
export function confirm(message, opts = {}) {
  if (opts.assumeYes) return Promise.resolve(true)

  const input = opts.input ?? process.stdin
  const output = opts.output ?? process.stdout
  const def = Boolean(opts.default)

  // No TTY and no --yes? Auto-resolve to default to keep CI scripts safe.
  if (!isTTY(input) || !isTTY(output)) {
    return Promise.resolve(def)
  }

  const hint = def ? '(Y/n)' : '(y/N)'
  return new Promise((resolve, reject) => {
    const rl = createInterface({ input, output, terminal: true })
    const onAbort = () => {
      rl.close()
      reject(new DOMException('Aborted', 'AbortError'))
    }
    if (opts.signal) {
      if (opts.signal.aborted) { onAbort(); return }
      opts.signal.addEventListener('abort', onAbort, { once: true })
    }
    rl.question(`${message} ${hint} `, (answer) => {
      opts.signal?.removeEventListener('abort', onAbort)
      rl.close()
      const a = (answer ?? '').trim().toLowerCase()
      if (a === '') return resolve(def)
      resolve(a === 'y' || a === 'yes')
    })
  })
}
