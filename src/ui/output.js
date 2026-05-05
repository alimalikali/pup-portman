/**
 * Centralizes stdout / stderr discipline. Every command writes through here.
 *
 * @typedef {{ stdout: NodeJS.WriteStream, stderr: NodeJS.WriteStream }} OutputStreams
 */

/**
 * @param {OutputStreams} streams
 * @param {string} text
 */
export function print(streams, text) {
  streams.stdout.write(text + (text.endsWith('\n') ? '' : '\n'))
}

/**
 * @param {OutputStreams} streams
 * @param {string} text
 */
export function printError(streams, text) {
  streams.stderr.write(text + (text.endsWith('\n') ? '' : '\n'))
}

/**
 * @param {OutputStreams} streams
 * @param {unknown} value
 */
export function printJson(streams, value) {
  streams.stdout.write(JSON.stringify(value, null, 2) + '\n')
}

/**
 * Write raw text without trailing newline.
 * @param {OutputStreams} streams
 * @param {string} text
 */
export function write(streams, text) {
  streams.stdout.write(text)
}
