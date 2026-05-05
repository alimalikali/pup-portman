import { isTTY } from '../utils/env.js'

/**
 * Send a terminal bell character.
 * @param {NodeJS.WriteStream} [stream]
 * @param {{ disabled?: boolean }} [opts]
 */
export function beep(stream = process.stdout, opts = {}) {
  if (opts.disabled) return
  if (!isTTY(stream)) return
  stream.write('\x07')
}
