import { EXIT_CODES } from '../constants/exit-codes.js'

export class PortmanError extends Error {
  /**
   * @param {string} message
   * @param {object} [opts]
   * @param {string} [opts.code]
   * @param {number} [opts.exitCode]
   * @param {string} [opts.userMessage]
   * @param {unknown} [opts.cause]
   * @param {Record<string, unknown>} [opts.details]
   */
  constructor(message, opts = {}) {
    super(message, opts.cause !== undefined ? { cause: opts.cause } : undefined)
    this.name = this.constructor.name
    this.code = opts.code ?? 'ERR_PORTMAN'
    this.exitCode = opts.exitCode ?? EXIT_CODES.GENERAL
    this.userMessage = opts.userMessage ?? message
    this.details = opts.details ?? {}
  }
}
