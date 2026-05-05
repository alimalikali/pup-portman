/**
 * In-memory stream stand-in for stdout/stderr in command tests.
 */
export class CapturedStream {
  constructor() {
    /** @type {string[]} */
    this.chunks = []
    this.isTTY = false
  }
  /** @param {string} s */
  write(s) {
    this.chunks.push(String(s))
    return true
  }
  get text() {
    return this.chunks.join('')
  }
}

/**
 * Build a mocked CliContext suitable for integration tests.
 * @param {Partial<import('../../src/cli/router.js').CliContext>} overrides
 */
export function makeCtx(overrides = {}) {
  return {
    stdout: new CapturedStream(),
    stderr: new CapturedStream(),
    stdin: /** @type {any} */ ({ isTTY: false }),
    env: {},
    cwd: process.cwd(),
    exec: async () => ({ stdout: '', stderr: '', code: 0 }),
    adapter: { name: 'linux', findByPort: async () => [], listAll: async () => [] },
    store: /** @type {any} */ ({ list: async () => [], save: async () => ({}), load: async () => [], remove: async () => true }),
    prompt: async () => false,
    platform: 'linux',
    ...overrides
  }
}
