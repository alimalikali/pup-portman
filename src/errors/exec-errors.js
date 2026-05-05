import { PortmanError } from './base.js'
import { EXIT_CODES } from '../constants/exit-codes.js'

export class ExecError extends PortmanError {
  /**
   * @param {string} message
   * @param {object} details
   * @param {string} details.file
   * @param {string[]} details.args
   * @param {number|null} details.code
   * @param {string} details.stdout
   * @param {string} details.stderr
   * @param {NodeJS.Signals|null} [details.signal]
   * @param {unknown} [details.cause]
   */
  constructor(message, details) {
    super(message, {
      code: 'ERR_EXEC_FAILED',
      exitCode: EXIT_CODES.GENERAL,
      userMessage: `Command "${details.file}" failed${details.code != null ? ` (exit ${details.code})` : ''}.`,
      cause: details.cause,
      details
    })
  }
}

export class ExecTimeoutError extends PortmanError {
  /**
   * @param {string} file
   * @param {number} timeoutMs
   */
  constructor(file, timeoutMs) {
    super(`Command "${file}" timed out after ${timeoutMs}ms`, {
      code: 'ERR_EXEC_TIMEOUT',
      exitCode: EXIT_CODES.GENERAL,
      userMessage: `Command "${file}" did not complete within ${timeoutMs}ms.`,
      details: { file, timeoutMs }
    })
  }
}
